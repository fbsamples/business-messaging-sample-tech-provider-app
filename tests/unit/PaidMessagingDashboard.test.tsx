// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PaidMessagingDashboard from "@/app/components/PaidMessagingDashboard";
import type { WabaClientData } from "@/app/types/api";

const mockWabas: WabaClientData[] = [
  {
    id: "waba_001",
    name: "Test WABA 1",
    phone_numbers: {
      data: [
        { id: "phone_001", display_phone_number: "+1 555-0001", verified_name: "Test Business", quality_rating: "GREEN", platform_type: "CLOUD_API", throughput: { level: "STANDARD" }, last_onboarded_time: "2024-01-01" },
        { id: "phone_002", display_phone_number: "+1 555-0002", verified_name: "Test Business 2", quality_rating: "GREEN", platform_type: "CLOUD_API", throughput: { level: "STANDARD" }, last_onboarded_time: "2024-01-01" },
      ],
    },
  },
  {
    id: "waba_002",
    name: "Test WABA 2",
    phone_numbers: { data: [] },
  },
];

const mockTemplates = [
  {
    name: "hello_world",
    language: "en_US",
    status: "APPROVED",
    category: "MARKETING",
    components: [
      { type: "BODY", text: "Hello, welcome to our service!" },
    ],
  },
  {
    name: "order_update",
    language: "en_US",
    status: "APPROVED",
    category: "UTILITY",
    components: [
      { type: "BODY", text: "Hi {{1}}, your order {{2}} is {{3}}." },
      { type: "FOOTER", text: "Thank you for shopping with us" },
    ],
  },
];

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("PaidMessagingDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders WABA dropdown with provided wabas", () => {
    render(<PaidMessagingDashboard wabas={mockWabas} />);

    expect(screen.getByText("Select a WABA...")).toBeInTheDocument();
    expect(screen.getByText("Test WABA 1")).toBeInTheDocument();
    expect(screen.getByText("Test WABA 2")).toBeInTheDocument();
  });

  it('shows "Select a WABA first..." when no WABA selected', () => {
    render(<PaidMessagingDashboard wabas={mockWabas} />);

    // Phone and template dropdowns should both be disabled
    const phoneSelect = screen.getAllByRole("combobox")[1];
    const templateSelect = screen.getAllByRole("combobox")[2];
    expect(phoneSelect).toBeDisabled();
    expect(templateSelect).toBeDisabled();
    // Multiple dropdowns show this text - verify at least one exists
    const wabaFirstOptions = screen.getAllByText("Select a WABA first...");
    expect(wabaFirstOptions.length).toBeGreaterThanOrEqual(1);
  });

  it("fetches templates when WABA is selected", async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ templates: mockTemplates }),
    });

    render(<PaidMessagingDashboard wabas={mockWabas} />);

    const wabaSelect = screen.getAllByRole("combobox")[0];
    await user.selectOptions(wabaSelect, "waba_001");

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/paid_messaging/templates?waba_id=waba_001",
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
    });
  });

  it("shows template dropdown after fetch", async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ templates: mockTemplates }),
    });

    render(<PaidMessagingDashboard wabas={mockWabas} />);

    const wabaSelect = screen.getAllByRole("combobox")[0];
    await user.selectOptions(wabaSelect, "waba_001");

    await waitFor(() => {
      expect(screen.getByText("hello_world (en_US)")).toBeInTheDocument();
      expect(screen.getByText("order_update (en_US)")).toBeInTheDocument();
    });
  });

  it("shows variable inputs when a template with variables is selected", async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ templates: mockTemplates }),
    });

    render(<PaidMessagingDashboard wabas={mockWabas} />);

    // Select WABA
    await user.selectOptions(screen.getAllByRole("combobox")[0], "waba_001");

    await waitFor(() => {
      expect(screen.getByText("hello_world (en_US)")).toBeInTheDocument();
    });

    // Select template with variables
    const templateSelect = screen.getAllByRole("combobox")[2];
    await user.selectOptions(templateSelect, "order_update::en_US");

    expect(screen.getByPlaceholderText("Value for {{1}}")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Value for {{2}}")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Value for {{3}}")).toBeInTheDocument();
  });

  it("validates E.164 recipient format", async () => {
    const user = userEvent.setup();
    render(<PaidMessagingDashboard wabas={mockWabas} />);

    const recipientInput = screen.getByPlaceholderText("+1234567890");
    await user.type(recipientInput, "invalid");

    expect(
      screen.getByText(/Phone number must be in E\.164 format/)
    ).toBeInTheDocument();
  });

  it("does not show E.164 error for valid number", async () => {
    const user = userEvent.setup();
    render(<PaidMessagingDashboard wabas={mockWabas} />);

    const recipientInput = screen.getByRole("textbox");
    await user.type(recipientInput, "+15551234567");

    expect(
      screen.queryByText(/Phone number must be in E\.164 format/)
    ).not.toBeInTheDocument();
  });

  it("send button is disabled when form is incomplete", () => {
    render(<PaidMessagingDashboard wabas={mockWabas} />);

    const sendButton = screen.getByRole("button", { name: /send template message/i });
    expect(sendButton).toBeDisabled();
  });

  it("calls /api/paid_messaging/send with correct payload on submit", async () => {
    const user = userEvent.setup();

    // Template fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ templates: mockTemplates }),
    });

    render(<PaidMessagingDashboard wabas={mockWabas} />);

    // Select WABA
    await user.selectOptions(screen.getAllByRole("combobox")[0], "waba_001");
    await waitFor(() => {
      expect(screen.getByText("hello_world (en_US)")).toBeInTheDocument();
    });

    // Select phone
    await user.selectOptions(screen.getAllByRole("combobox")[1], "phone_001");

    // Select simple template (no variables)
    await user.selectOptions(screen.getAllByRole("combobox")[2], "hello_world::en_US");

    // Enter recipient
    await user.type(screen.getByPlaceholderText("+1234567890"), "+15551234567");

    // Mock send response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          messages: [{ id: "wamid.test123" }],
        }),
    });

    // Click send
    const sendButton = screen.getByRole("button", { name: /send template message/i });
    expect(sendButton).not.toBeDisabled();
    await user.click(sendButton);

    await waitFor(() => {
      const sendCall = mockFetch.mock.calls.find(
        (call: any[]) => call[0] === "/api/paid_messaging/send"
      );
      expect(sendCall).toBeDefined();
      const body = JSON.parse(sendCall![1].body);
      expect(body.waba_id).toBe("waba_001");
      expect(body.phone_number_id).toBe("phone_001");
      expect(body.template_name).toBe("hello_world");
      expect(body.template_language).toBe("en_US");
      expect(body.recipient).toBe("+15551234567");
    });

    // Verify success message
    await waitFor(() => {
      expect(screen.getByText(/Message sent successfully/)).toBeInTheDocument();
    });
  });

  it("shows error banner when send fails", async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          templates: [mockTemplates[0]], // simple template, no vars
        }),
    });

    render(<PaidMessagingDashboard wabas={mockWabas} />);

    // Fill the form
    await user.selectOptions(screen.getAllByRole("combobox")[0], "waba_001");
    await waitFor(() => {
      expect(screen.getByText("hello_world (en_US)")).toBeInTheDocument();
    });
    await user.selectOptions(screen.getAllByRole("combobox")[1], "phone_001");
    await user.selectOptions(screen.getAllByRole("combobox")[2], "hello_world::en_US");
    await user.type(screen.getByPlaceholderText("+1234567890"), "+15551234567");

    // Mock send failure
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Insufficient funds for template message" }),
    });

    await user.click(screen.getByRole("button", { name: /send template message/i }));

    await waitFor(() => {
      expect(screen.getByText("Insufficient funds for template message")).toBeInTheDocument();
    });
  });
});
