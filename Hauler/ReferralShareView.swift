import SwiftUI

struct ReferralSection: View {
    var body: some View {
        Section("Referral") {
            Text("Enter or update your referral token so you can share it from the extension.")
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
    @State private var referralTokenDraft: String = ""
    @State private var didSave = false

    var body: some View {
        VStack(alignment: layout.alignment, spacing: 12) {
            TextField("Referral token", text: $referralTokenDraft)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled(true)
                .keyboardType(.asciiCapable)
                .textFieldStyle(.roundedBorder)

            Button(action: saveReferralToken) {
                Label("Save referral token", systemImage: "tray.and.arrow.down")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .disabled(referralTokenDraft == referralToken)

            if didSave {
                Label("Referral token saved", systemImage: "checkmark.circle.fill")
                    .font(.footnote)
                    .foregroundColor(.green)
            }
        }
        .frame(maxWidth: .infinity, alignment: layout.containerAlignment)
        .onAppear(perform: syncDraftWithStoredToken)
        .onChange(of: referralToken, perform: { _ in syncDraftWithStoredToken() })
        .onChange(of: referralTokenDraft) { newValue in
            if didSave && newValue != referralToken {
                didSave = false
            }
        }
    }

    private func syncDraftWithStoredToken() {
        referralTokenDraft = ReferralSettings.normalizedToken(referralToken)
    }

    private func saveReferralToken() {
        let normalizedToken = ReferralSettings.normalizedToken(referralTokenDraft)
        referralToken = normalizedToken
        referralTokenDraft = normalizedToken

        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
            didSave = true
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                didSave = false
            }
        }
    }
}
