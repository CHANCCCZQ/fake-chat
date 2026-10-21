// Optional macOS source for the committed PNG. CI uses public/social-card.png directly.
import AppKit
let width = 1200, height = 630
let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: width, pixelsHigh: height, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)
func color(_ hex: UInt32) -> NSColor { NSColor(srgbRed: CGFloat((hex >> 16) & 255)/255, green: CGFloat((hex >> 8) & 255)/255, blue: CGFloat(hex & 255)/255, alpha: 1) }
func rect(_ x: CGFloat, _ y: CGFloat, _ w: CGFloat, _ h: CGFloat, _ radius: CGFloat, _ hex: UInt32) {
 color(hex).setFill(); NSBezierPath(roundedRect: NSRect(x: x, y: y, width: w, height: h), xRadius: radius, yRadius: radius).fill()
}
func text(_ value: String, _ x: CGFloat, _ y: CGFloat, _ size: CGFloat, _ hex: UInt32, _ weight: NSFont.Weight = .regular) {
 (value as NSString).draw(at: NSPoint(x: x, y: y), withAttributes: [.font: NSFont.systemFont(ofSize: size, weight: weight), .foregroundColor: color(hex)])
}
func phone(_ x: CGFloat, _ y: CGFloat, _ own: Bool) {
 rect(x, y, 188, 378, 24, 0xdbe3d8); rect(x+2, y+2, 184, 374, 22, 0xffffff); rect(x+8, y+8, 172, 362, 17, 0xededed)
 text("14:18", x+24, y+335, 10, 0x3d3f3f, .semibold)
 rect(x+137, y+340, 20, 9, 3, 0x3d3f3f)
 text(own ? "对方" : "自己", x+76, y+298, 12, 0x283b31)
 for i in 0..<4 {
   let by = y+248-CGFloat(i)*51
   let right = (i%2 == 0) == own
   rect(x+(right ? 57 : 23), by, 106, 32, 5, right ? 0x95ec69 : 0xffffff)
   rect(x+(right ? 74 : 36), by+18, 66, 3, 1, 0x647468)
   rect(x+(right ? 74 : 36), by+10, 45, 3, 1, 0x89998c)
 }
 rect(x+8, y+8, 172, 43, 13, 0xf6f6f6); rect(x+31, y+19, 118, 22, 4, 0xffffff)
}
rect(0,0,1200,630,0,0xf7f8f5)
rect(72,467,58,58,14,0x27744f); rect(87,482,28,25,9,0xffffff); rect(87,479,8,12,2,0xffffff);rect(90,485,22,19,7,0x27744f)
text("对话工坊",72,352,54,0x283b31,.semibold)
text("微信聊天记录模拟工具",76,295,28,0x526457)
text("把一段对话，自然地编排出来。",76,242,23,0x526457)
text("双视角  ·  图片  ·  红包  ·  转账  ·  截图",76,137,20,0x27744f,.medium)
text("草稿保存在当前浏览器",76,96,17,0x586c5d)
phone(733,143,false);phone(940,92,true)
NSGraphicsContext.restoreGraphicsState()
try bitmap.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: "public/social-card.png"))
