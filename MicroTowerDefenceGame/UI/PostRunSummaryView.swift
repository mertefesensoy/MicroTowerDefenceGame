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
                        VStack(alignment: .leading, spacing: 4) {
                            Text("UNLOCKED:")
                                .font(.caption)
                                .foregroundStyle(.green)
                            ForEach(model.unlocks, id: \.self) { unlock in
                                Text("• \(unlock)")
                                    .font(.subheadline)
                                    .foregroundStyle(.white)
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

#Preview {
    PostRunSummaryView(
        model: PostRunPresentation(
            didWin: true,
            wavesCompleted: 10,
            totalCoins: 1250,
            durationStats: "12:45",
            xpGained: 500,
            startLevel: 5,
            endLevel: 6,
            unlocks: ["Cannon_V2", "Relic_Slot_2"],
            saveStatus: .saved(seed: 123456)
        ),
        onContinue: {}
    )
}
