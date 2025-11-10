//
//  SafariWebExtensionHandler.swift
//  Hauler Safari
//
//  Created by Karl Marx on 10/15/25.
//

import SafariServices
import os.log

private enum ExtensionCommand: String {
    case getReferral
    case setReferral
    case referralLink
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
        guard let message = message as? [String: Any],
              let commandValue = message["command"] as? String,
              let command = ExtensionCommand(rawValue: commandValue) else {
            return ["error": "invalid-command"]
        }

        switch command {
        case .getReferral:
            return referralPayload(using: storedToken())
        case .setReferral:
            let rawToken = message["token"] as? String ?? ""
            let normalized = ReferralSettings.normalizedToken(rawToken)
            ReferralSettings.sharedDefaults.set(normalized, forKey: ReferralSettings.tokenKey)
            return referralPayload(using: normalized)
        case .referralLink:
            let overrideToken = message["token"] as? String
            let token = overrideToken.map { token in
                let normalized = ReferralSettings.normalizedToken(token)
                return normalized.isEmpty ? storedToken() : normalized
            } ?? storedToken()

            return referralPayload(using: token)
        }
    }

    private func storedToken() -> String {
        let stored = ReferralSettings.sharedDefaults.string(forKey: ReferralSettings.tokenKey) ?? ""
        return ReferralSettings.normalizedToken(stored)
    }

    private func referralPayload(using token: String) -> [String: Any] {
        let normalized = ReferralSettings.normalizedToken(token)
        let link = ReferralSettings.referralLink(for: normalized)
        return [
            "token": normalized,
            "link": link.absoluteString
        ]
    }

}
