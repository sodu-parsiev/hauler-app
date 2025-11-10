import Foundation

enum ReferralSettings {
    static let appGroupIdentifier = "group.com.hauler.shared"
    static let tokenKey = "referralToken"
    static let fallbackURL = URL(string: "https://haulerbuy.com/")!

    static let sharedDefaults: UserDefaults = {
        if let defaults = UserDefaults(suiteName: appGroupIdentifier) {
            return defaults
        }
        return .standard
    }()

    static func referralLink(for token: String) -> URL {
        let trimmed = token.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty,
              let encodedToken = trimmed.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
              let url = URL(string: "https://haulerbuy.com/?ref=\(encodedToken)") else {
            return fallbackURL
        }

        return url
    }
}
