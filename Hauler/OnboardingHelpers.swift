import UIKit

/// Opens the Safari web extension's welcome page so the user can activate it.
/// Falls back to the marketplace test page if the welcome page cannot be opened.
func openSafariWelcomePage() {
    let welcomeURL = URL(string: "safari-web-extension://com.sodikjon.hauler.safari/welcome.html")
    let fallbackURLs = [
        "https://weidian.com/item.html?itemID=2570705409",
        "https://item.taobao.com/item.htm?id=1234567890",
        "https://detail.1688.com/offer/1234567890123.html"
    ].compactMap(URL.init(string:))

    guard let url = welcomeURL ?? fallbackURLs.first else { return }

    UIApplication.shared.open(url, options: [:]) { success in
        guard !success, let fallback = fallbackURLs.first else { return }
        UIApplication.shared.open(fallback)
    }
}

/// Opens the app’s settings page.
func openAppSettings() {
    guard let url = URL(string: UIApplication.openSettingsURLString) else { return }
    UIApplication.shared.open(url)
}
