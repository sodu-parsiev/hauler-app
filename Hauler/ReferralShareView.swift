import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

struct ReferralSection: View {
    var body: some View {
        Section("Referral") {
            Text("Enter or update your referral token to generate a shareable link.")
                .font(.footnote)
                .foregroundColor(.secondary)

            ReferralShareView()
        }
    }
}

struct ReferralShareView: View {
    enum Layout {
        case list
        case onboarding

        var alignment: HorizontalAlignment {
            switch self {
            case .list:
                return .leading
            case .onboarding:
                return .center
            }
        }

        var containerAlignment: Alignment {
            switch self {
            case .list:
                return .leading
            case .onboarding:
                return .center
            }
        }
    }

    var layout: Layout = .list

    @AppStorage(ReferralSettings.tokenKey, store: ReferralSettings.sharedDefaults) private var referralToken: String = ""
    @State private var didCopy = false

    var body: some View {
        VStack(alignment: layout.alignment, spacing: 12) {
            TextField("Referral token", text: $referralToken)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled(true)
                .keyboardType(.asciiCapable)
                .textFieldStyle(.roundedBorder)

            Button(action: copyReferralLink) {
                Label("Share referral link", systemImage: "link")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)

            if didCopy {
                Label("Link copied to clipboard", systemImage: "checkmark.circle.fill")
                    .font(.footnote)
                    .foregroundColor(.green)
            }
        }
        .frame(maxWidth: .infinity, alignment: layout.containerAlignment)
    }

    private func copyReferralLink() {
        let url = ReferralSettings.referralLink(for: referralToken)
#if canImport(UIKit)
        UIPasteboard.general.string = url.absoluteString
#endif
        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
            didCopy = true
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                didCopy = false
            }
        }
    }
}
