//
//  SafariWebExtensionHandler.swift
//  Hauler Safari
//
//  Created by Karl Marx on 10/15/25.
//

import Foundation
import SafariServices
import os.log

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

        switch command {
        case .getReferralToken:
            response = [
                "referralToken": storedToken()
            ]
        case .getReferral:
            response = [
                "token": storedToken()
            ]
        case .setReferral:
            let rawToken = payload?["token"] as? String ?? ""
            let normalized = ReferralSettings.normalizedToken(rawToken)
            ReferralDefaults.shared.set(normalized, forKey: ReferralDefaults.tokenKey)
            response = [
                "token": normalized
            ]
        case .referralLink:
            let providedToken = payload?["token"] as? String ?? ""
            let normalized = ReferralSettings.normalizedToken(providedToken)
            let token = normalized.isEmpty ? storedToken() : normalized
            let link = ReferralSettings.referralLink(for: token).absoluteString
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
        return ReferralSettings.normalizedToken(stored)
    }
}
