// SettingsView.swift
import SwiftUI

struct SettingsView: View {
    var body: some View {
        NavigationView {
            List {
                Section("Safari Extension") {
                    Text("Enable the Hauler extension in Safari to use it on marketplace pages.")
                    Button("Open Safari", action: openSafariWelcomePage)
                    Button("Open App Settings", action: openAppSettings)
                }

                ReferralSection()
            }
            .navigationTitle("Hauler")
        }
    }
}
