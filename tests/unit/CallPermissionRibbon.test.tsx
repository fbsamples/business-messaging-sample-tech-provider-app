// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CallPermissionRibbon from '@/app/components/CallPermissionRibbon';

describe('CallPermissionRibbon', () => {
  it('renders nothing when permission state is none', () => {
    const { container } = render(
      <CallPermissionRibbon permissionState="none" onRequestPermission={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows checking state', () => {
    render(<CallPermissionRibbon permissionState="checking" onRequestPermission={() => {}} />);
    expect(screen.getByText('Checking call permissions...')).toBeInTheDocument();
  });

  it('shows requesting state with button', () => {
    render(<CallPermissionRibbon permissionState="requesting" onRequestPermission={() => {}} />);
    expect(screen.getByText('Call permission required')).toBeInTheDocument();
    expect(screen.getByText('Request Permission')).toBeInTheDocument();
  });

  it('shows requesting state with remaining requests', () => {
    render(
      <CallPermissionRibbon
        permissionState="requesting"
        remainingRequests="1 request left today"
        onRequestPermission={() => {}}
      />,
    );
    expect(screen.getByText(/1 request left today/)).toBeInTheDocument();
  });

  it('calls onRequestPermission when button clicked', async () => {
    const onRequest = vi.fn();
    render(<CallPermissionRibbon permissionState="requesting" onRequestPermission={onRequest} />);
    const buttons = screen.getAllByText('Request Permission');
    await userEvent.click(buttons[buttons.length - 1]);
    expect(onRequest).toHaveBeenCalledOnce();
  });

  it('shows pending state', () => {
    render(<CallPermissionRibbon permissionState="pending" onRequestPermission={() => {}} />);
    expect(screen.getByText(/Permission request sent/)).toBeInTheDocument();
  });

  it('shows granted state', () => {
    render(<CallPermissionRibbon permissionState="granted" onRequestPermission={() => {}} />);
    expect(screen.getByText(/Permission granted/)).toBeInTheDocument();
  });

  it('shows granted state with expiration time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-17T12:00:00Z'));
    const expTime = Date.now() + 2 * 24 * 60 * 60 * 1000; // 2 days
    render(
      <CallPermissionRibbon
        permissionState="granted"
        expirationTime={expTime}
        onRequestPermission={() => {}}
      />,
    );
    expect(screen.getByText(/expires in 2d 0h 0m/)).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('shows denied state with Request Again button', async () => {
    const onRequest = vi.fn();
    render(<CallPermissionRibbon permissionState="denied" onRequestPermission={onRequest} />);
    expect(screen.getByText('Permission declined')).toBeInTheDocument();
    const button = screen.getByText('Request Again');
    expect(button).toBeInTheDocument();
    await userEvent.click(button);
    expect(onRequest).toHaveBeenCalledOnce();
  });

  it('shows rate limited state', () => {
    render(<CallPermissionRibbon permissionState="rate_limited" onRequestPermission={() => {}} />);
    expect(screen.getByText(/Call permission request limit reached/)).toBeInTheDocument();
  });
});
