import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash,
  AlertCircle,
  FileText,
  MoreHorizontal,
  Filter,
} from "lucide-react";
import api from "@/services/api";

interface Test {
  _id: string;
  title: string;
  description: string;
  category: string;
  questions: number;
  timeLimit: number;
  status: "active" | "draft" | "archived";
  createdAt: string;
  updatedAt: string;
}

export default function AdminTests() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "draft" | "archived"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/tests");
      setTests(response.data);

      // Extract unique categories
      const uniqueCategories = [
        ...new Set(response.data.map((test: Test) => test.category)),
      ];
      setCategories(uniqueCategories);

      setError(null);
    } catch (err) {
      console.error("Error fetching tests:", err);
      setError("Failed to load tests. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = async (
    testData: Omit<Test, "_id" | "createdAt" | "updatedAt">
  ) => {
    try {
      const response = await api.post("/admin/tests", testData);
      setTests([...tests, response.data]);
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error("Error creating test:", err);
      // Show error message
    }
  };

  const handleUpdateTest = async (testId: string, testData: Partial<Test>) => {
    try {
      const response = await api.put(`/admin/tests/${testId}`, testData);
      setTests(
        tests.map((test) => (test._id === testId ? response.data : test))
      );
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Error updating test:", err);
      // Show error message
    }
  };

  const handleDeleteTest = async (testId: string) => {
    try {
      await api.delete(`/admin/tests/${testId}`);
      setTests(tests.filter((test) => test._id !== testId));
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error("Error deleting test:", err);
      // Show error message
    }
  };

  const filteredTests = tests.filter((test) => {
    const matchesSearch =
      test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || test.status === statusFilter;

    const matchesCategory =
      categoryFilter === "all" || test.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="h-2 w-2 mr-1 rounded-full bg-green-400"></span>
            Active
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <span className="h-2 w-2 mr-1 rounded-full bg-yellow-400"></span>
            Draft
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <span className="h-2 w-2 mr-1 rounded-full bg-gray-400"></span>
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        <span className="ml-3 text-gray-600">Loading tests...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start">
        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <p className="mt-1 text-sm text-red-700">{error}</p>
          <button
            onClick={fetchTests}
            className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Manage Tests</h2>
        <div className="flex space-x-4">
          <div className="relative">
            <Filter className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Filter className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tests..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Test
          </button>
        </div>
      </div>

      {filteredTests.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-gray-600 font-medium">No tests found</h3>
          <p className="text-gray-500 mt-1">
            {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
              ? "Try adjusting your search or filters"
              : "No tests have been created yet"}
          </p>
          {tests.length === 0 && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg inline-flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Test
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white overflow-hidden shadow rounded-xl">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Test Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Category
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Questions
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Time Limit
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Last Updated
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTests.map((test) => (
                <tr key={test._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-sky-250 rounded-full flex items-center justify-center">
                        <FileText className="h-5 w-5 text-sky-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {test.title}
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {test.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {test.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {test.questions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {test.timeLimit} min
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(test.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(test.updatedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2 justify-end">
                      <button
                        onClick={() => {
                          setSelectedTest(test);
                          setIsEditModalOpen(true);
                        }}
                        className="text-sky-600 hover:text-sky-900"
                        title="Edit Test"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTest(test);
                          setIsDeleteModalOpen(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Test"
                      >
                        <Trash className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Test Modal */}
      {isCreateModalOpen && (
        <TestFormModal
          title="Create New Test"
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateTest}
          categories={categories}
        />
      )}

      {/* Edit Test Modal */}
      {isEditModalOpen && selectedTest && (
        <TestFormModal
          title="Edit Test"
          test={selectedTest}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={(data) => handleUpdateTest(selectedTest._id, data)}
          categories={categories}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Delete Test
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{selectedTest.title}"? This
              action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTest(selectedTest._id)}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface TestFormModalProps {
  title: string;
  test?: Test;
  onClose: () => void;
  onSubmit: (data: any) => void;
  categories: string[];
}

function TestFormModal({
  title,
  test,
  onClose,
  onSubmit,
  categories,
}: TestFormModalProps) {
  const [formData, setFormData] = useState({
    title: test?.title || "",
    description: test?.description || "",
    category: test?.category || (categories.length > 0 ? categories[0] : ""),
    questions: test?.questions || 10,
    timeLimit: test?.timeLimit || 30,
    status: test?.status || "draft",
    newCategory: "",
  });

  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalCategory = showNewCategoryInput
      ? formData.newCategory
      : formData.category;

    const submitData = {
      title: formData.title,
      description: formData.description,
      category: finalCategory,
      questions: Number(formData.questions),
      timeLimit: Number(formData.timeLimit),
      status: formData.status as "active" | "draft" | "archived",
    };

    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Test Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700"
            >
              Category
            </label>
            {!showNewCategoryInput ? (
              <div className="flex space-x-2">
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCategoryInput(true)}
                  className="mt-1 bg-gray-200 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-300"
                >
                  New
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <input
                  type="text"
                  id="newCategory"
                  name="newCategory"
                  value={formData.newCategory}
                  onChange={handleChange}
                  placeholder="Enter new category"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewCategoryInput(false)}
                  className="mt-1 bg-gray-200 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="questions"
                className="block text-sm font-medium text-gray-700"
              >
                Number of Questions
              </label>
              <input
                type="number"
                id="questions"
                name="questions"
                min="1"
                value={formData.questions}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div>
              <label
                htmlFor="timeLimit"
                className="block text-sm font-medium text-gray-700"
              >
                Time Limit (minutes)
              </label>
              <input
                type="number"
                id="timeLimit"
                name="timeLimit"
                min="1"
                value={formData.timeLimit}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="bg-white text-gray-700 border border-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-sky-600 text-white py-2 px-4 rounded-lg hover:bg-sky-700"
            >
              {test ? "Update Test" : "Create Test"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
