export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-semibold mb-4">POR Chat Admin</h1>
        {children}
      </div>
    </div>
  );
}




