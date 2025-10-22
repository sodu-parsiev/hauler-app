// SettingsView.swift
import SwiftUI

struct SettingsView: View {
    var body: some View {
        NavigationView {
            List {
                Section("Safari Extension") {
                    Text("Enable the Hauler extension in Safari to use it on marketplace pages.")
                    Button("Open Safari Test Page", action: openSafariTestPage)
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
