export interface BackgroundRemovalAdapter {
  removeBackground(imageUrl: string): Promise<{ outputUrl: string; provider: string }>;
}

export class MockBackgroundRemovalAdapter implements BackgroundRemovalAdapter {
  async removeBackground(imageUrl: string) {
    return { outputUrl: imageUrl + (imageUrl.includes("?") ? "&" : "?") + "bgRemoved=mock", provider: "mock-local" };
  }
}

export const backgroundRemoval = new MockBackgroundRemovalAdapter();
