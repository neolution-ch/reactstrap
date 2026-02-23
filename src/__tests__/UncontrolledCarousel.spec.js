import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { Carousel, UncontrolledCarousel } from '..';

const items = [
  {
    src: '',
    altText: 'a',
    caption: 'caption 1',
    key: '1',
  },
  {
    src: '',
    altText: 'b',
    caption: 'caption 2',
    key: '2',
  },
  {
    src: '',
    altText: 'c',
    caption: 'caption 3',
    key: '3',
  },
];

let user;

describe('UncontrolledCarousel', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime.bind(jest) });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should have active element default to 0', () => {
    render(<UncontrolledCarousel items={items} />);
    expect(screen.getByAltText('a').parentElement).toHaveClass('active');
  });

  it('should autoplay by default', () => {
    render(<UncontrolledCarousel items={items} />);
    expect(screen.getByAltText('a').parentElement).toHaveClass('active');
    act(() => { jest.advanceTimersByTime(5000); });
    expect(screen.getByAltText('b').parentElement).toHaveClass(
      'carousel-item carousel-item-start carousel-item-next',
    );
    act(() => { jest.advanceTimersByTime(600); });
    expect(screen.getByAltText('b').parentElement).toHaveClass('active');
  });

  it('should not play automatically when autoPlay is false', () => {
    render(<UncontrolledCarousel items={items} autoPlay={false} />);
    expect(screen.getByAltText('a').parentElement).toHaveClass('active');
    jest.advanceTimersByTime(5000);
    expect(screen.getByAltText('b').parentElement).not.toHaveClass(
      'carousel-item carousel-item-start carousel-item-next',
    );
    jest.advanceTimersByTime(600);
    expect(screen.getByAltText('b').parentElement).not.toHaveClass('active');
  });

  it('should move to next slide when next button is clicked', async () => {
    render(<UncontrolledCarousel items={items} autoPlay={false} />);
    await user.click(screen.getByText(/next/i));
    act(() => { jest.advanceTimersByTime(600); });
    expect(screen.getByAltText('b').parentElement).toHaveClass(
      'carousel-item active',
    );
  });

  it('should not move to next slide while animating', async () => {
    render(<UncontrolledCarousel items={items} />);
    await user.click(screen.getByText(/next/i));
    expect(screen.getByAltText('b').parentElement).toHaveClass(
      'carousel-item carousel-item-start carousel-item-next',
    );
    await user.click(screen.getByText(/next/i));
    expect(screen.getByAltText('c').parentElement).not.toHaveClass(
      'carousel-item carousel-item-start carousel-item-next',
    );
  });

  it('should wrap to first slide on reaching the end', async () => {
    render(<UncontrolledCarousel items={items} autoPlay={false} />);
    await user.click(screen.getByText(/next/i));
    act(() => { jest.advanceTimersByTime(600); });
    expect(screen.getByAltText('b').parentElement).toHaveClass('active');

    await user.click(screen.getByText(/next/i));
    act(() => { jest.advanceTimersByTime(600); });
    expect(screen.getByAltText('c').parentElement).toHaveClass('active');

    await user.click(screen.getByText(/next/i));
    act(() => { jest.advanceTimersByTime(600); });
    expect(screen.getByAltText('a').parentElement).toHaveClass('active');
  });

  it('should move to previous slide when previous button is clicked', async () => {
    render(<UncontrolledCarousel items={items} autoPlay={false} />);
    await user.click(screen.getByText(/next/i));
    act(() => { jest.advanceTimersByTime(600); });
    expect(screen.getByAltText('b').parentElement).toHaveClass(
      'carousel-item active',
    );

    await user.click(screen.getByText(/previous/i));
    act(() => { jest.advanceTimersByTime(600); });
    expect(screen.getByAltText('a').parentElement).toHaveClass(
      'carousel-item active',
    );
  });

  it('should not move to previous slide while animating', async () => {
    render(<UncontrolledCarousel items={items} />);
    await user.click(screen.getByText(/next/i));
    expect(screen.getByAltText('b').parentElement).toHaveClass(
      'carousel-item carousel-item-start carousel-item-next',
    );
    await user.click(screen.getByText(/previous/i));
    expect(screen.getByAltText('a').parentElement).not.toHaveClass(
      'carousel-item carousel-item-start carousel-item-next',
    );
  });

  it('should wrap to last slide on reaching the beginning', async () => {
    render(<UncontrolledCarousel items={items} autoPlay={false} />);
    await user.click(screen.getByText(/previous/i));
    act(() => { jest.advanceTimersByTime(600); });
    expect(screen.getByAltText('c').parentElement).toHaveClass('active');
  });
});
