// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MessageBubble from '@/app/components/MessageBubble';

describe('MessageBubble', () => {
  describe('text messages', () => {
    it('renders incoming text message', () => {
      render(
        <MessageBubble type="text" text="Hello" direction="incoming" timestamp={Date.now()} />,
      );
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('renders outgoing text message', () => {
      render(
        <MessageBubble type="text" text="Hi there" direction="outgoing" timestamp={Date.now()} />,
      );
      expect(screen.getByText('Hi there')).toBeInTheDocument();
    });
  });

  describe('call event messages', () => {
    it('shows incoming voice call with direction', () => {
      render(
        <MessageBubble type="call_event" event="started" direction="inbound" timestamp={Date.now()} />,
      );
      expect(screen.getByText('Incoming voice call')).toBeInTheDocument();
    });

    it('shows outgoing voice call with direction', () => {
      render(
        <MessageBubble type="call_event" event="started" direction="outbound" timestamp={Date.now()} />,
      );
      expect(screen.getByText('Outgoing voice call')).toBeInTheDocument();
    });

    it('defaults to outgoing label when no direction', () => {
      const { container } = render(
        <MessageBubble type="call_event" event="started" timestamp={Date.now()} />,
      );
      expect(container.textContent).toContain('Outgoing voice call');
    });

    it('shows call ended with duration', () => {
      render(
        <MessageBubble type="call_event" event="ended" direction="inbound" duration={125} timestamp={Date.now()} />,
      );
      expect(screen.getByText(/Incoming call/)).toBeInTheDocument();
      expect(screen.getByText(/2:05/)).toBeInTheDocument();
    });

    it('shows missed call', () => {
      render(
        <MessageBubble type="call_event" event="missed" timestamp={Date.now()} />,
      );
      expect(screen.getByText('Missed call')).toBeInTheDocument();
    });

    it('shows call declined', () => {
      render(
        <MessageBubble type="call_event" event="declined" timestamp={Date.now()} />,
      );
      expect(screen.getByText('Call declined')).toBeInTheDocument();
    });

    it('shows call failed', () => {
      render(
        <MessageBubble type="call_event" event="failed" timestamp={Date.now()} />,
      );
      expect(screen.getByText('Call failed')).toBeInTheDocument();
    });
  });

  describe('permission event messages', () => {
    it('shows permission requested', () => {
      render(
        <MessageBubble type="permission_event" event="requested" timestamp={Date.now()} />,
      );
      expect(screen.getByText('Call permission requested')).toBeInTheDocument();
    });

    it('shows permission granted', () => {
      render(
        <MessageBubble type="permission_event" event="granted" timestamp={Date.now()} />,
      );
      expect(screen.getByText('Call permission granted')).toBeInTheDocument();
    });

    it('shows permission declined', () => {
      render(
        <MessageBubble type="permission_event" event="declined" timestamp={Date.now()} />,
      );
      expect(screen.getByText('Call permission declined')).toBeInTheDocument();
    });
  });
});
