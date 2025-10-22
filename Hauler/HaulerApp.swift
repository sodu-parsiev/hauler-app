import SwiftUI

@main
struct HaulerApp: App {
    @AppStorage("didOnboard") private var didOnboard = false

    var body: some Scene {
        WindowGroup {
            if didOnboard {
                HomeView()
            } else {
                OnboardingSingleView()
            }
        }
    }
}

private struct HomeView: View {
    var body: some View {
        NavigationView {
            List {
                Section("Safari Extension") {
                    Text("You can re-open Safari to use the Hauler extension.")
                        .font(.body)
                    Button("Open Safari", action: openSafariWelcomePage)
                    Button("Open App Settings", action: openAppSettings)
                }

                Section("Community") {
                    Link("Open Community", destination: URL(string: "https://haulerbuy.com/community?ref=ios_app")!)
                }
            }
            .navigationTitle("Hauler")
        }
    }
}
