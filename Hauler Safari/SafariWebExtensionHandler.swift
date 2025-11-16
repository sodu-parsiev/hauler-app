//
//  SafariWebExtensionHandler.swift
//  Hauler Safari
//
//  Created by Karl Marx on 10/15/25.
//

import Foundation
import OSLog
import SafariServices

private enum ExtensionCommand: String {
    case getReferralToken = "getReferralToken"
    case getReferral = "getReferral"
    case setReferral = "setReferral"
    case referralLink = "referralLink"
}

private enum ReferralDefaults {
    static let appGroupIdentifier = "group.com.hauler.shared"
    static let tokenKey = "referralToken"

    static var shared: UserDefaults {
        UserDefaults(suiteName: appGroupIdentifier) ?? .standard
    }
}

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {

    private let logger = Logger(subsystem: "com.sodikjon.hauler", category: "SafariWebExtensionHandler")

    func beginRequest(with context: NSExtensionContext) {
        let request = context.inputItems.first as? NSExtensionItem

        let profile: UUID?
        if #available(iOS 17.0, macOS 14.0, *) {
            profile = request?.userInfo?[SFExtensionProfileKey] as? UUID
        } else {
            profile = request?.userInfo?["profile"] as? UUID
        }

        let message: Any?
        if #available(iOS 15.0, macOS 11.0, *) {
            message = request?.userInfo?[SFExtensionMessageKey]
        } else {
            message = request?.userInfo?["message"]
        }

        os_log(.default, "Received message from browser.runtime.sendNativeMessage: %@ (profile: %@)", String(describing: message), profile?.uuidString ?? "none")

        let payload = handle(message: message)

        let response = NSExtensionItem()
        if #available(iOS 15.0, macOS 11.0, *) {
            response.userInfo = [ SFExtensionMessageKey: payload ]
        } else {
            response.userInfo = [ "message": payload ]
        }

        context.completeRequest(returningItems: [ response ], completionHandler: nil)
    }

    private func handle(message: Any?) -> [String: Any] {
        let (payload, messageId) = extractPayloadAndIdentifier(from: message)
        let commandValue = payload?["command"] as? String
        let command = commandValue.flatMap(ExtensionCommand.init(rawValue:))

        var response: [String: Any]

        logger.debug("Handling command: \(commandValue ?? "unknown", privacy: .public) (messageId: \(messageId ?? "none", privacy: .public))")

        switch command {
        case .getReferralToken:
            let token = storedToken()
            logger.debug("Received getReferralToken request. Returning token: \(token, privacy: .public)")
            response = [
                "referralToken": token
            ]
        case .getReferral:
            let token = storedToken()
            logger.debug("Received getReferral request. Returning token: \(token, privacy: .public)")
            response = [
                "token": token
            ]
        case .setReferral:
            let rawToken = payload?["token"] as? String ?? ""
            let normalized = ReferralSettings.normalizedToken(rawToken)
            logger.debug("Received setReferral request. Raw token: \(rawToken, privacy: .public), normalized: \(normalized, privacy: .public)")
            ReferralDefaults.shared.set(normalized, forKey: ReferralDefaults.tokenKey)
            response = [
                "token": normalized
            ]
        case .referralLink:
            let providedToken = payload?["token"] as? String ?? ""
            let normalized = ReferralSettings.normalizedToken(providedToken)
            let token = normalized.isEmpty ? storedToken() : normalized
            let link = ReferralSettings.referralLink(for: token).absoluteString
            logger.debug("Received referralLink request. Provided token: \(providedToken, privacy: .public), normalized: \(normalized, privacy: .public), using token: \(token, privacy: .public)")
            response = [
                "token": token,
                "link": link
            ]
        case .none:
            response = [
                "referralToken": storedToken(),
                "error": "invalid-command"
            ]
        }

        if let messageId = messageId {
            response["messageId"] = messageId
        }

        return response
    }

    private func extractPayloadAndIdentifier(from message: Any?) -> ([String: Any]?, String?) {
        var identifier: String?
        var candidate: Any? = message

        if let container = message as? [String: Any] {
            identifier = container["messageId"] as? String
            if let payload = container["payload"] {
                candidate = payload
            }
        }

        if let data = candidate as? Data {
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                return (json, identifier)
            }
        }

        if let string = candidate as? String,
           let data = string.data(using: .utf8),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            return (json, identifier)
        }

        if let dictionary = candidate as? [String: Any] {
            return (dictionary, identifier)
        }

        return (nil, identifier)
    }

    private func storedToken() -> String {
        let stored = ReferralDefaults.shared.string(forKey: ReferralDefaults.tokenKey) ?? ""
        let normalized = ReferralSettings.normalizedToken(stored)
        logger.debug("Fetching stored token: \(normalized, privacy: .public)")
        return normalized
    }
}
