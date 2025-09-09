import { Link } from "react-router-dom";

interface PlaceholderProps {
  title: string;
  description: string;
}

export default function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <div className="min-h-screen bg-figma-bg flex items-center justify-center">
      <div className="bg-figma-card border border-figma-border rounded-2xl p-8 max-w-md text-center">
        <h1 className="font-poppins text-2xl font-bold text-figma-text-primary mb-4">{title}</h1>
        <p className="font-poppins text-figma-text-secondary mb-6">{description}</p>
        <div className="space-y-3">
          <p className="font-poppins text-sm text-figma-text-secondary">
            This page is under construction. Please continue prompting to fill in this page content.
          </p>
          <Link
            to="/"
            className="inline-block bg-black text-white px-6 py-3 rounded font-roboto hover:bg-gray-800 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
