// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MicroTDCore",
    platforms: [
        .iOS(.v16),
        .macOS(.v11)
    ],
    products: [
        .library(
            name: "MicroTDCore",
            targets: ["MicroTDCore"]),
    ],
    targets: [
        .target(
            name: "MicroTDCore",
            dependencies: [],
            resources: [
                .process("Resources")
            ]
        ),
        .testTarget(
            name: "MicroTDCoreTests",
            dependencies: ["MicroTDCore"]
        ),
    ]
)
