"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ExamPage from "@/components/forms/ExamForm";
import GenerateDMCPage from "@/components/GenerateDMCPage";
import GenerateMigrationCertificatesPage from "@/components/MigrationGeneration";
import GenerateCharacterCertificatesPage from "@/components/charactergeneration";
import GeneratediplomaCertificatesPage from "@/components/certificategeneration/diplomageneration";
import GeneratetranscriptCertificatesPage from "./certificategeneration/transcriptgeneration";
import GenerateResult from "@/components/certificategeneration/resultgeneration";
function ExamDashboard({ role }: { role?: string }) {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const router = useRouter();

  const examOptions = [
    { 
      id: "manageExam", 
      title: "Manage Examination", 
      description: "Create and manage datesheets for upcoming examinations",
      icon: "📝"
    },
    { 
      id: "viewResults", 
      title: "View Submitted Results", 
      description: "Check and review all submitted examination results",
      icon: "📊",
      route: "/list/results/registrar"
    },
    { 
      id: "generateDMC", 
      title: "Generate DMC", 
      description: "Create detailed marks certificates for students",
      icon: "🎓"
    },
    { 
      id: "migrationCert", 
      title: "Generate Migration Certificate", 
      description: "Issue official migration certificates for 8th semester students",
      icon: "📜"
    },
    { 
      id: "characterCert", 
      title: "Generate Character Certificate", 
      description: "Issue official character certificates for students",
      icon: "📜"
    },
    { 
      id: "transcript", 
      title: "Generate Transcript", 
      description: "Compile complete academic records for students",
      icon: "📋"
    },
    { 
      id: "diploma", 
      title: "Generate Diploma", 
      description: "Issue official degree certificates for graduates",
      icon: "🎯"
    },
    { 
      id: "publishResult", 
      title: "Publish Result", 
      description: "Make examination results available to students",
      icon: "📢"
    },
    { 
      id: "nadPortal", 
      title: "Generate Data for NAD Portal", 
      description: "Export academic records for National Academic Depository",
      icon: "🔗"
    },
  ];

  const handleClick = (id: string, route?: string) => {
    if (route) {
      router.push(route);
    } else {
      setSelectedComponent(id);
    }
  };

  // Render the selected component
  const renderComponent = () => {
    switch (selectedComponent) {
      case "manageExam":
        return <ExamPage role={role} />;
      case "generateDMC":
        return <GenerateDMCPage />;
      case "migrationCert":
        return <GenerateMigrationCertificatesPage />;
      case "characterCert":
        return <GenerateCharacterCertificatesPage />;
      case "diploma":
        return <GeneratediplomaCertificatesPage />;
      case "publishResult":
        return <GenerateResult />;
      case "transcript":
        return <GeneratetranscriptCertificatesPage />;
      default:
        return null;
    }
  };

  // Group the options in pairs for two boxes per row
  const groupedOptions = [];
  for (let i = 0; i < examOptions.length; i += 3) {
    groupedOptions.push(examOptions.slice(i, i + 3));
  }

  return (
    <div className="p-6 bg-blue-50">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 font-mono">
          EXAMS AND RESULTS
        </h1>
        <div className="h-1 w-24 bg-red-500"></div>
        <p className="text-red-500 mt-4">
          Manage examination processes and generate academic documents
        </p>
      </div>

      {selectedComponent ? (
        <div>
          <button 
            onClick={() => setSelectedComponent(null)}
            className="mb-6 py-2 px-6 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Back to Dashboard
          </button>
          <div className="bg-white p-6 rounded-lg shadow-md">
            {renderComponent()}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {groupedOptions.map((group, groupIndex) => (
            <div key={groupIndex} className="grid grid-cols-2 md:grid-cols-3 gap-12">
              {group.map((option) => (
                <div 
                  key={option.id} 
                  className="bg-teal-50 p-6 rounded-lg shadow-md hover:shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all duration-300 border-l-4 border-blue-800 "
                >
                  <div className="flex items-start mb-4">
                    <span className="text-3xl mr-4">{option.icon}</span>
                    <div>
                      <h3 className="text-xl font-bold text-black">{option.title}</h3>
                      <p className="text-gray-600 mt-1">{option.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleClick(option.id, option.route)}
                    className="w-1/2 mt-4 py-3 bg-blue-700 text-white rounded-md hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                  >
                    Access
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExamDashboard;