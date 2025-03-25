'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const GenerateDMCPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [completedStudents, setCompletedStudents] = useState<number>(0);

  // Array of semesters to choose from
  const semesters = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    label: `Semester ${i + 1}`
  }));

  const handleGenerateDMCs = async () => {
    if (!selectedSemester) {
      toast.error('Please select a semester');
      return;
    }
    

    try {
      setIsLoading(true);
      setProgress(0);
      setCompletedStudents(0);

      // First, get the count of students in this semester
      const countResponse = await fetch(`/api/dmc/count?semesterId=${selectedSemester}`);
      const { count } = await countResponse.json();
      
      setTotalStudents(count);
      
      if (count === 0) {
        toast.error('No students found for the selected semester');
        setIsLoading(false);
        return;
      }

      // Start the PDF generation process
      const response = await fetch('/api/dmc/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ semesterId: selectedSemester }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate DMCs');
      }

      const data = await response.json();
      
      if (data.success) {
        if (data.dataUrl) {
          // Create an anchor element and trigger download
          const link = document.createElement('a');
          link.href = data.dataUrl;
          link.download = data.filename || `dmc_semester_${selectedSemester}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast.success('DMC generation completed. Downloading ZIP file...');
        } else if (data.url) {
          // Fallback to the old method if dataUrl is not provided
          window.location.href = data.url;
          toast.success('DMC generation completed. Downloading ZIP file...');
        } else {
          toast.error('Download link not provided');
        }
      } else {
        toast.error(data.message || 'Failed to generate DMCs');
      }
    } catch (error) {
      console.error('Error generating DMCs:', error);
      toast.error('Error generating DMCs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for progress updates using EventSource (Server-Sent Events)
  const startProgressListener = () => {
    const eventSource = new EventSource('/api/dmc/progress');
    
    eventSource.addEventListener('progress', (event) => {
      const data = JSON.parse(event.data);
      setCompletedStudents(data.completed);
      setProgress(data.percentage);
      
      if (data.completed === data.total) {
        eventSource.close();
      }
    });
    
    eventSource.addEventListener('error', () => {
      eventSource.close();
    });
    
    return () => {
      eventSource.close();
    };
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Generate DMC for Multiple Students</h2>
      
      <div className="mb-6">
        <label htmlFor="semester" className="block text-gray-700 font-medium mb-2">
          Select Semester
        </label>
        <div className="relative">
          <select
            id="semester"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="block w-full py-3 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          >
            <option value="">Select a semester</option>
            {semesters.map((semester) => (
              <option key={semester.id} value={semester.id}>
                {semester.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && totalStudents > 0 && (
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">
            Processing {completedStudents} of {totalStudents} students ({Math.round(progress)}%)
          </p>
        </div>
      )}

      <button
        onClick={handleGenerateDMCs}
        disabled={isLoading || !selectedSemester}
        className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 transition-colors"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <Loader2 className="animate-spin mr-2 h-5 w-5" />
            Generating DMCs...
          </span>
        ) : (
          'Generate DMCs'
        )}
      </button>
    </div>
  );
};

export default GenerateDMCPage;