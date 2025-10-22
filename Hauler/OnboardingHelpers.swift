import UIKit

/// Opens a marketplace test link in Safari so the user can activate the extension.
func openSafariTestPage() {
    let urls = [
        "https://weidian.com/item.html?itemID=2570705409",
        "https://item.taobao.com/item.htm?id=1234567890",
        "https://detail.1688.com/offer/1234567890123.html"
    ]
    if let url = URL(string: urls[0]) {
        UIApplication.shared.open(url)
    }
}

/// Opens the app’s settings page.
func openAppSettings() {
    guard let url = URL(string: UIApplication.openSettingsURLString) else { return }
    UIApplication.shared.open(url)
}
