import Foundation
import OSLog

enum ReferralSettings {
    static let appGroupIdentifier = "group.com.hauler.shared"
    static let tokenKey = "referralToken"
    static let fallbackURL = URL(string: "https://haulerbuy.com/")!
    private static let logger = Logger(subsystem: "com.sodikjon.hauler", category: "ReferralSettings")

    static let sharedDefaults: UserDefaults = {
        guard let defaults = UserDefaults(suiteName: appGroupIdentifier) else {
            assertionFailure("Failed to load shared UserDefaults suite named \(appGroupIdentifier)")
            logger.error("Failed to load shared UserDefaults suite named \(appGroupIdentifier, privacy: .public). Falling back to UserDefaults.standard.")
            return .standard
        }
        return defaults
    }()

    static func normalizedToken(_ token: String) -> String {
        token.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    static func referralLink(for token: String) -> URL {
        let trimmed = normalizedToken(token)
        guard !trimmed.isEmpty,
              let encodedToken = trimmed.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
              let url = URL(string: "https://haulerbuy.com/?ref=\(encodedToken)") else {
            return fallbackURL
        }

        return url
    }
}
