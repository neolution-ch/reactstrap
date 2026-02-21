import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { testForCustomClass, testForCustomTag } from '../testUtils';
import { Alert } from '..';

let user;

describe('Alert', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime.bind(jest) });
  });

  it('should render children', () => {
    render(<Alert>Yo!</Alert>);
    expect(screen.getByText('Yo!')).toBeInTheDocument();
  });

  it('should render additional classes', () => {
    testForCustomClass(Alert);
  });

  it('should render custom tag', () => {
    testForCustomTag(Alert);
  });

  it('should pass close className down', () => {
    const noop = () => {};
    render(
      <Alert toggle={noop} closeClassName="test-class-name">
        Yo!
      </Alert>,
    );

    expect(screen.getByLabelText('Close')).toHaveClass('test-class-name');
  });

  it('should pass other props down', () => {
    render(<Alert data-testprop="testvalue">Yo!</Alert>);
    expect(screen.getByText('Yo!')).toHaveAttribute(
      'data-testprop',
      'testvalue',
    );
  });

  it('should have "success" as default color', () => {
    render(<Alert>Yo!</Alert>);
    expect(screen.getByText('Yo!')).toHaveClass('alert-success');
  });

  it('should accept color prop', () => {
    render(<Alert color="warning">Yo!</Alert>);
    expect(screen.getByText('Yo!')).toHaveClass('alert-warning');
  });

  it('should use a div tag by default', () => {
    render(<Alert>Yo!</Alert>);
    expect(screen.getByText('Yo!').tagName.toLowerCase()).toEqual('div');
  });

  it('should be non dismissible by default', () => {
    render(<Alert>Yo!</Alert>);

    expect(screen.queryByLabelText('Close')).toBe(null);
    expect(screen.getByText('Yo!')).not.toHaveClass('alert-dismissible');
  });

  it('should show dismiss button if passed toggle', () => {
    render(
      <Alert color="danger" toggle={() => {}}>
        Yo!
      </Alert>,
    );

    expect(screen.getByLabelText('Close')).toBeInTheDocument();
    expect(screen.getByText('Yo!')).toHaveClass('alert-dismissible');
  });

  it('should be empty if not isOpen', () => {
    render(<Alert isOpen={false}>Yo!</Alert>);
    expect(screen.queryByText('Yo!')).toBe(null);
  });

  it('should be dismissible', async () => {
    const mockFn = jest.fn();
    render(
      <Alert color="danger" toggle={mockFn}>
        Yo!
      </Alert>,
    );
    screen.getByText('Yo!');

    await user.click(screen.getByLabelText('Close'));
    expect(mockFn).toHaveBeenCalled();
  });

  it('should render close button with custom aria-label', () => {
    render(
      <Alert toggle={() => {}} closeAriaLabel="oseclay">
        Yo!
      </Alert>,
    );

    expect(screen.getByLabelText('oseclay')).toBeInTheDocument();
  });

  it('should have default transitionTimeouts', () => {
    render(<Alert>Hello</Alert>);

    expect(screen.getByText(/hello/i)).not.toHaveClass('show');

    act(() => { jest.advanceTimersByTime(150); });
    expect(screen.getByText(/hello/i)).toHaveClass('show');
  });

  it('should have support configurable transitionTimeouts', () => {
    render(
      <Alert
        transition={{
          timeout: 0,
          appear: false,
          enter: false,
          exit: false,
        }}
      >
        Hello
      </Alert>,
    );

    expect(screen.getByText(/hello/i)).toHaveClass('show');
  });

  it('works with strict mode', () => {
    const spy = jest.spyOn(console, 'error');
    render(
      <React.StrictMode>
        <Alert>Hello</Alert>
      </React.StrictMode>,
    );
    expect(spy).not.toHaveBeenCalled();
  });
});
