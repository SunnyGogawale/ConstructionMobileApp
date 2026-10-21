export async function requestMediaLibraryPermissionsAsync() {
  return { granted: true, status: "granted", canAskAgain: true };
}

export function launchImageLibraryAsync(options = {}) {
  return new Promise(resolve => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = Boolean(options.allowsMultipleSelection);
    input.addEventListener("change", () => {
      const assets = Array.from(input.files || []).map(file => ({
        uri: URL.createObjectURL(file),
        file,
        fileName: file.name,
        mimeType: file.type,
      }));
      resolve({ canceled: assets.length === 0, assets });
    }, { once: true });
    input.addEventListener("cancel", () => resolve({ canceled: true, assets: [] }), { once: true });
    input.click();
  });
}
