import { useState, useRef, useEffect } from 'react';

interface SearchSource {
  id: string;
  name: string;
  url: string;
  description: string;
  category?: 'general' | 'academic';
  isCustom?: boolean;
}

interface SearchWindow {
  [key: string]: Window | null;
}

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedEngines, setSelectedEngines] = useState<{[key: string]: boolean}>({});
  const [customSources, setCustomSources] = useState<SearchSource[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSource, setNewSource] = useState<SearchSource>({
    id: '',
    name: '',
    url: '',
    description: '',
    category: 'general',
    isCustom: true
  });
  const searchWindows = useRef<SearchWindow>({});

  const defaultSearchSources: SearchSource[] = [
    { 
      id: 'google', 
      name: 'Google',
      url: 'https://www.google.com/search?q=',
      description: 'General web search',
      category: 'general'
    },
    { 
      id: 'bing', 
      name: 'Bing',
      url: 'https://www.bing.com/search?q=',
      description: 'Microsoft search engine',
      category: 'general'
    },
    { 
      id: 'google_scholar', 
      name: 'Google Scholar',
      url: 'https://scholar.google.com/scholar?q=',
      description: 'Academic papers and citations',
      category: 'academic'
    },
    { 
      id: 'pubmed', 
      name: 'PubMed',
      url: 'https://pubmed.ncbi.nlm.nih.gov/?term=',
      description: 'Biomedical literature',
      category: 'academic'
    },
    { 
      id: 'semantic_scholar', 
      name: 'Semantic Scholar',
      url: 'https://www.semanticscholar.org/search?q=',
      description: 'AI-powered research tool',
      category: 'academic'
    },
    { 
      id: 'arxiv', 
      name: 'arXiv',
      url: 'https://arxiv.org/search/?query=',
      description: 'Scientific paper repository',
      category: 'academic'
    },
    { 
      id: 'research_gate', 
      name: 'ResearchGate',
      url: 'https://www.researchgate.net/search/publication?q=',
      description: 'Scientific network and papers',
      category: 'academic'
    },
    { 
      id: 'dblp', 
      name: 'DBLP',
      url: 'https://dblp.org/search?q=',
      description: 'Computer Science Bibliography',
      category: 'academic'
    }
  ];

  // 合并默认和自定义搜索源
  const searchSources = [...defaultSearchSources, ...customSources];

  // 加载保存的搜索引擎选择和自定义搜索源
  useEffect(() => {
    const savedPreferences = localStorage.getItem('searchEnginePreferences');
    const savedCustomSources = localStorage.getItem('customSearchSources');
    
    if (savedPreferences) {
      setSelectedEngines(JSON.parse(savedPreferences));
    } else {
      const defaultPreferences = defaultSearchSources.reduce((acc, source) => {
        acc[source.id] = true;
        return acc;
      }, {} as {[key: string]: boolean});
      setSelectedEngines(defaultPreferences);
      localStorage.setItem('searchEnginePreferences', JSON.stringify(defaultPreferences));
    }

    if (savedCustomSources) {
      setCustomSources(JSON.parse(savedCustomSources));
    }
  }, []);

  // 保存搜索引擎选择
  const handleEngineToggle = (sourceId: string) => {
    const newSelectedEngines = {
      ...selectedEngines,
      [sourceId]: !selectedEngines[sourceId]
    };
    setSelectedEngines(newSelectedEngines);
    localStorage.setItem('searchEnginePreferences', JSON.stringify(newSelectedEngines));
  };

  // 添加新的搜索源
  const handleAddSource = () => {
    if (!newSource.name || !newSource.url) return;

    // 生成唯一ID
    newSource.id = `custom_${Date.now()}`;
    
    const updatedCustomSources = [...customSources, newSource];
    setCustomSources(updatedCustomSources);
    localStorage.setItem('customSearchSources', JSON.stringify(updatedCustomSources));
    
    // 自动选中新添加的搜索源
    const newSelectedEngines = {
      ...selectedEngines,
      [newSource.id]: true
    };
    setSelectedEngines(newSelectedEngines);
    localStorage.setItem('searchEnginePreferences', JSON.stringify(newSelectedEngines));

    // 重置表单并关闭模态框
    setNewSource({
      id: '',
      name: '',
      url: '',
      description: '',
      category: 'general',
      isCustom: true
    });
    setShowAddModal(false);
  };

  // 删除自定义搜索源
  const handleDeleteSource = (sourceId: string) => {
    const updatedCustomSources = customSources.filter(source => source.id !== sourceId);
    setCustomSources(updatedCustomSources);
    localStorage.setItem('customSearchSources', JSON.stringify(updatedCustomSources));

    // 从选中列表中移除
    const newSelectedEngines = { ...selectedEngines };
    delete newSelectedEngines[sourceId];
    setSelectedEngines(newSelectedEngines);
    localStorage.setItem('searchEnginePreferences', JSON.stringify(newSelectedEngines));
  };

  const isWindowOpen = (win: Window | null): boolean => {
    return win != null && !win.closed;
  };

  const openSearchWindow = (source: SearchSource, query: string) => {
    const searchUrl = `${source.url}${encodeURIComponent(query)}`;
    const windowName = `search_${source.id}`;
    
    if (isWindowOpen(searchWindows.current[source.id])) {
      searchWindows.current[source.id]?.location.replace(searchUrl);
    } else {
      const windowFeatures = 'noopener=yes,noreferrer=yes';
      const newWindow = window.open(searchUrl, windowName, windowFeatures);
      searchWindows.current[source.id] = newWindow;
    }

    searchWindows.current[source.id]?.focus();
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);

    // 只搜索选中的搜索引擎
    const selectedSources = searchSources.filter(source => selectedEngines[source.id]);
    
    for (let i = 0; i < selectedSources.length; i++) {
      const source = selectedSources[i];
      setTimeout(() => {
        openSearchWindow(source, searchQuery);
      }, i * 100);
    }
  };

  const handleSingleSearch = (source: SearchSource) => {
    if (!searchQuery.trim()) return;
    openSearchWindow(source, searchQuery);
  };

  useEffect(() => {
    return () => {
      Object.values(searchWindows.current).forEach(window => {
        if (isWindowOpen(window)) {
          window?.close();
        }
      });
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Search Header */}
      <div className="flex-none p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
            LiteResearch Search||公众号: 正经人王同学
          </h1>
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-3 text-lg rounded-full border border-gray-300 
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                       dark:bg-gray-800 dark:border-gray-700 dark:text-white
                       shadow-sm hover:shadow-md transition-shadow"
              placeholder="Enter your search query..."
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 
                       bg-blue-500 text-white px-6 py-2 rounded-full 
                       hover:bg-blue-600 transition-colors"
            >
              Search Selected
            </button>
          </form>
        </div>
      </div>

      {/* Search Sources Grid */}
      <div className="flex-grow p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Add New Source Button */}
          <div className="flex justify-end px-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
            >
              Add Custom Search Engine
            </button>
          </div>

          {/* General Search Engines */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 px-4">
              General Search
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchSources.filter(source => source.category === 'general').map((source) => (
                <div 
                  key={source.id} 
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`engine-${source.id}`}
                        checked={selectedEngines[source.id] || false}
                        onChange={() => handleEngineToggle(source.id)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {source.name}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {source.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSingleSearch(source)}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full
                                 text-gray-700 dark:text-gray-300 text-sm font-medium
                                 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Search
                      </button>
                      {source.isCustom && (
                        <button
                          onClick={() => handleDeleteSource(source.id)}
                          className="px-3 py-2 bg-red-100 dark:bg-red-900 rounded-full
                                   text-red-600 dark:text-red-300 text-sm font-medium
                                   hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  {isSearching && searchQuery && isWindowOpen(searchWindows.current[source.id]) && (
                    <div className="mt-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Window is open - "{searchQuery}"
                      </div>
                      <button
                        onClick={() => searchWindows.current[source.id]?.focus()}
                        className="inline-block mt-2 text-blue-500 hover:text-blue-600 dark:text-blue-400"
                      >
                        ↗ Focus window
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Academic Search Engines */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 px-4">
              Academic Search
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchSources.filter(source => source.category === 'academic').map((source) => (
                <div 
                  key={source.id} 
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`engine-${source.id}`}
                        checked={selectedEngines[source.id] || false}
                        onChange={() => handleEngineToggle(source.id)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {source.name}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {source.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSingleSearch(source)}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full
                                 text-gray-700 dark:text-gray-300 text-sm font-medium
                                 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Search
                      </button>
                      {source.isCustom && (
                        <button
                          onClick={() => handleDeleteSource(source.id)}
                          className="px-3 py-2 bg-red-100 dark:bg-red-900 rounded-full
                                   text-red-600 dark:text-red-300 text-sm font-medium
                                   hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  {isSearching && searchQuery && isWindowOpen(searchWindows.current[source.id]) && (
                    <div className="mt-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Window is open - "{searchQuery}"
                      </div>
                      <button
                        onClick={() => searchWindows.current[source.id]?.focus()}
                        className="inline-block mt-2 text-blue-500 hover:text-blue-600 dark:text-blue-400"
                      >
                        ↗ Focus window
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Add Custom Search Engine
            </h2>
            <form onSubmit={(e) => { e.preventDefault(); handleAddSource(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newSource.name}
                  onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search URL (include %s where the search term should go)
                </label>
                <input
                  type="text"
                  value={newSource.url}
                  onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                  placeholder="https://example.com/search?q=%s"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newSource.description}
                  onChange={(e) => setNewSource({ ...newSource, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={newSource.category}
                  onChange={(e) => setNewSource({ ...newSource, category: e.target.value as 'general' | 'academic' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="general">General</option>
                  <option value="academic">Academic</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Add Search Engine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex-none p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto text-center space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Click "Search Selected" to search in selected engines, or use individual search buttons.
          </p>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>Contact: 微信公众号: 正经人王同学</p>
            <p>
              <a 
                href="https://github.com/zjrwtx/literesearch_search" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 dark:text-blue-400"
              >
                GitHub Open Source
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
