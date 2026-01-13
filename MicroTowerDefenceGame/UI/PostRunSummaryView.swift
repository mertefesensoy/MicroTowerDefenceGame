import SwiftUI
import MicroTDCore

struct PostRunSummaryView: View {
    let model: PostRunPresentation
    let onContinue: () -> Void
    
    var body: some View {
        ZStack {
            // 1. Dimmed Background (Captures all touches)
            Color.black.opacity(0.85)
                .ignoresSafeArea()
                .contentShape(Rectangle())
                .onTapGesture { /* Consume touches to prevent game interaction */ }
            
            // 2. Content Card
            VStack(spacing: 24) {
                // Header
                Text(model.didWin ? "VICTORY!" : "DEFEAT")
                    .font(.system(size: 42, weight: .black))
                    .foregroundStyle(model.didWin ? .yellow : .red)
                    .shadow(color: .black, radius: 2, x: 0, y: 2)
                
                // Stats Grid
                HStack(spacing: 40) {
                    StatBadge(val: "\(model.wavesCompleted)", label: "Waves")
                    StatBadge(val: "\(model.totalCoins)", label: "Coins")
                    StatBadge(val: model.durationStats, label: "Time")
                }
                
                Divider().background(Color.white.opacity(0.3))
                
                // Progression Section
                VStack(spacing: 12) {
                    Text("PROGRESSION")
                        .font(.caption)
                        .tracking(2)
                        .foregroundStyle(.white.opacity(0.7))
                    
                    HStack {
                        Text("+\(model.xpGained) XP")
                            .font(.title2)
                            .bold()
                            .foregroundStyle(.blue)
                        
                        if model.didLevelUp {
                            Text("LEVEL UP! \(model.startLevel) → \(model.endLevel)")
                                .font(.headline)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.yellow)
                                .foregroundStyle(.black)
                                .cornerRadius(8)
                        }
                    }
                    
                    if !model.unlocks.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("UNLOCKED:")
                                .font(.caption)
                                .foregroundStyle(.green)
                            
                            ForEach(model.unlocks, id: \.self) { unlockID in
                                let d = UnlockCatalog.descriptor(for: unlockID)
                                UnlockRow(descriptor: d)
                            }
                        }
                        .padding()
                        .background(Color.white.opacity(0.1))
                        .cornerRadius(8)
                    }
                }
                
                Spacer()
                    .frame(height: 20)
                
                // Action
                Button(action: onContinue) {
                    Text("CONTINUE")
                        .font(.title3.bold())
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.white)
                        .foregroundStyle(.black)
                        .cornerRadius(12)
                }
                .padding(.horizontal, 40)
                
                // Persistence Status Footer
                Group {
                    switch model.saveStatus {
                    case .saved(let seed):
                        Text("Game Saved (Seed: \(String(seed, radix: 16).uppercased()))")
                            .foregroundStyle(.gray)
                    case .failed(let msg):
                        VStack {
                            Text("⚠️ Save Failed")
                                .foregroundStyle(.orange)
                            Text(msg).font(.caption2).foregroundStyle(.white.opacity(0.7))
                        }
                    case .protectedData:
                        Text("⚠️ Device Locked - Save Deferred")
                            .foregroundStyle(.yellow)
                    }
                }
                .font(.caption2)
                .padding(.top, 10)
            }
            .padding(30)
            .background(
                RoundedRectangle(cornerRadius: 24)
                    .fill(Color(hex: 0x242424))
                    .shadow(radius: 20)
            )
            .padding(20)
        }
    }
}

struct UnlockRow: View {
    let descriptor: UnlockDescriptor
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: descriptor.systemImage)
                .font(.title2)
                .foregroundColor(.yellow)
                .frame(width: 32)
            
            VStack(alignment: .leading) {
                Text(descriptor.title)
                    .font(.headline)
                    .foregroundStyle(.white)
                Text(descriptor.subtitle)
                    .font(.caption)
                    .foregroundStyle(.gray)
            }
        }
        .padding(.vertical, 4)
    }
}

struct XPAnimatedBar: View {
    let startLevel: Int
    let endLevel: Int
    let startFraction: Double   // 0...1 within startLevel
    let endFraction: Double     // 0...1 within endLevel
    let didWin: Bool

    @State private var shownLevel: Int
    @State private var progress: Double
    @State private var showLevelUp: Bool = false

    init(startLevel: Int, endLevel: Int, startFraction: Double, endFraction: Double, didWin: Bool) {
        self.startLevel = startLevel
        self.endLevel = endLevel
        self.startFraction = startFraction
        self.endFraction = endFraction
        self.didWin = didWin
        _shownLevel = State(initialValue: startLevel)
        _progress = State(initialValue: startFraction)
    }

    var body: some View {
        VStack(spacing: 6) {
            HStack {
                Text("Level \(shownLevel)")
                    .font(.headline)
                    .foregroundStyle(.white)

                Spacer()

                if showLevelUp {
                    Text("LEVEL UP!")
                        .font(.caption.bold())
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.yellow)
                        .foregroundStyle(.black)
                        .cornerRadius(8)
                        .transition(.scale)
                }
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(Color.white.opacity(0.15))

                    RoundedRectangle(cornerRadius: 8)
                        .fill(didWin ? Color.blue : Color.red)
                        .frame(width: geo.size.width * max(0, min(1, progress)))
                }
            }
            .frame(height: 12)
        }
        .task { await runAnimation() }
    }

    @MainActor
    private func runAnimation() async {
        // Delay slightly for modal transition
        try? await Task.sleep(nanoseconds: 300_000_000)
        
        // No level-up
        if startLevel == endLevel {
            withAnimation(.easeOut(duration: 0.9)) { progress = endFraction }
            return
        }

        // Step 1: finish current level
        withAnimation(.easeOut(duration: 0.7)) { progress = 1.0 }
        try? await Task.sleep(nanoseconds: 250_000_000)

        for lvl in (startLevel..<endLevel) {
            // Pulse badge
            withAnimation(.spring(response: 0.25, dampingFraction: 0.7)) { showLevelUp = true }
            try? await Task.sleep(nanoseconds: 250_000_000)
            withAnimation(.easeOut(duration: 0.2)) { showLevelUp = false }

            // Advance level and reset bar
            shownLevel = lvl + 1
            progress = 0.0
            try? await Task.sleep(nanoseconds: 120_000_000)

            // If this is the final level, fill to endFraction; otherwise fill to 1.0
            let target = (shownLevel == endLevel) ? endFraction : 1.0
            withAnimation(.easeOut(duration: 0.65)) { progress = target }
            try? await Task.sleep(nanoseconds: 200_000_000)
        }
    }
}

// Helper View
struct StatBadge: View {
    let val: String
    let label: String
    
    var body: some View {
        VStack(spacing: 4) {
            Text(val)
                .font(.title3.monospacedDigit().bold())
                .foregroundStyle(.white)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.gray)
        }
    }
}

// Color Helper
extension Color {
    init(hex: UInt) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255.0,
            green: Double((hex >> 8) & 0xFF) / 255.0,
            blue: Double(hex & 0xFF) / 255.0,
            opacity: 1
        )
    }
}


#if DEBUG
struct PostRunSummaryView_Previews: PreviewProvider {
    static var previews: some View {
        PostRunSummaryView(
            model: PostRunPresentation(
                didWin: true,
                wavesCompleted: 10,
                totalCoins: 1250,
                durationStats: "12:45",
                xpGained: 500,
                startLevel: 5,
                endLevel: 6,
                startFraction: 0.8,
                endFraction: 0.3,
                unlocks: ["tower_sniper", "relic_uncommon_pack", "unknown_test_id"],
                saveStatus: .saved(seed: 123456)
            ),
            onContinue: {}
        )
    }
}
#endif

