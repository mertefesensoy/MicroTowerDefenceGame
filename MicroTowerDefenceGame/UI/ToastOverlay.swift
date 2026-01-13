import SwiftUI

struct ToastOverlay: View {
    @ObservedObject var manager: ToastManager
    
    var body: some View {
        VStack {
            if let toast = manager.currentToast {
                HStack(spacing: 12) {
                    Image(systemName: toast.icon)
                        .font(.title3)
                        .foregroundStyle(toast.color)
                    
                    Text(toast.text)
                        .font(.subheadline.bold())
                        .foregroundStyle(.white)
                        .multilineTextAlignment(.leading)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(.ultraThinMaterial)
                .background(Color.black.opacity(0.6))
                .cornerRadius(24)
                .overlay(
                    RoundedRectangle(cornerRadius: 24)
                        .stroke(Color.white.opacity(0.1), lineWidth: 1)
                )
                .shadow(radius: 10)
                .padding(.top, 60) // Safe area inset
                .transition(.move(edge: .top).combined(with: .opacity))
                .id(toast.id) // Force transition for new unique toasts
            }
            Spacer()
        }
        .allowsHitTesting(false) // CRITICAL: Taps pass through to game
        .animation(.spring(), value: manager.currentToast)
    }
}


#if DEBUG
struct ToastOverlay_Previews: PreviewProvider {
    static var previews: some View {
        let mgr = ToastManager()
        Color.blue.ignoresSafeArea()
            .overlay(ToastOverlay(manager: mgr))
            .onAppear {
                mgr.show(text: "Game Saved", icon: "checkmark.circle", color: .green)
            }
    }
}
#endif

