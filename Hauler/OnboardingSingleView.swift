import SwiftUI

struct OnboardingSingleView: View {
    @AppStorage("didOnboard") private var didOnboard = false
    private let logoURL = URL(string: "https://haulerbuy.com/wp-content/uploads/2025/09/cropped-hauler-logo.svg")

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {

                // MARK: - Logo
                ZStack {
                    Circle()
                        .fill(Color(.systemGray6))
                        .frame(width: 96, height: 96)
                    if let url = logoURL {
                        AsyncImage(url: url) { phase in
                            switch phase {
                            case .empty:
                                ProgressView().frame(width: 60, height: 60)
                            case .success(let img):
                                img
                                    .resizable()
                                    .scaledToFit()
                                    .frame(width: 64, height: 64)
                            case .failure(_):
                                Text("📦").font(.system(size: 40))
                            @unknown default:
                                Text("📦").font(.system(size: 40))
                            }
                        }
                    }
                }
                .padding(.top, 24)

                // MARK: - Title + Subtitle
                Text("Enable Hauler in Safari")
                    .font(.title2).bold()
                    .multilineTextAlignment(.center)
                    .padding(.top, 8)

                Text("Turn on the Hauler Safari extension to open marketplace pages in HaulerBuy and join the community instantly.")
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)

                // MARK: - Step List
                VStack(alignment: .leading, spacing: 10) {
                    Label("Open Safari", systemImage: "safari")
                    Label("Tap **aA** → **Manage Extensions**", systemImage: "puzzlepiece.extension")
                    Label("Turn on **Hauler**", systemImage: "switch.2")
                    Label("Choose **Allow on All Websites**", systemImage: "globe")
                }
                .font(.body)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(16)
                .background(Color(.systemGray6))
                .cornerRadius(14)
                .padding(.horizontal, 20)

                // MARK: - Buttons
                VStack(spacing: 12) {
                    Button {
                        openSafariTestPage()
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "arrow.up.right.square")
                            Text("Open Safari Test Page")
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)

                    Button {
                        openAppSettings()
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "gearshape")
                            Text("Open App Settings")
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.large)

                    Button {
                        didOnboard = true
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "checkmark.circle.fill")
                            Text("I’ve enabled it")
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderless)
                    .controlSize(.large)
                    .padding(.top, 4)
                }
                .padding(.horizontal, 20)

                // MARK: - Footer Links
                HStack(spacing: 16) {
                    Link("Community", destination: URL(string: "https://haulerbuy.com/community?ref=ios_onboarding")!)
                    Link("Learn more", destination: URL(string: "https://haulerbuy.com/")!)
                }
                .font(.footnote)
                .foregroundColor(.secondary)
                .padding(.bottom, 24)
            }
        }
    }
}
