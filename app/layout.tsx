import './globals.css';

export const metadata = {
  title: 'DA Prep: Your exam control desk',
  description: 'An adaptive study planner for GATE DA — syllabus, resources and a plan that recalculates as your progress changes.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
