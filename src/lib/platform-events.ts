// Simple event system for platform verification updates

type EventListener = () => void;

class PlatformEvents {
  private listeners: Set<EventListener> = new Set();

  subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(): void {
    this.listeners.forEach(listener => listener());
  }
}

export const platformEvents = new PlatformEvents();