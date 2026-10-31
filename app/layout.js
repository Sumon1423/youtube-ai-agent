
export const metadata = {
  title: "YouTube AI Agent",
  description: "Your personal AI YouTube Manager"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        background: "#101419",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif"
      }}>
        {children}
      </body>
    </html>
  );
}
