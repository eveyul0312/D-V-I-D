import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { DiceScene } from './three-scene';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Rnd } from 'react-rnd';
import { Edit2, Check, Type, Move, Maximize2, ChevronDown, Image as ImageIcon, Upload, LogIn, LogOut } from 'lucide-react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  doc, 
  collection, 
  onSnapshot, 
  setDoc, 
  getDoc,
  handleFirestoreError,
  OperationType,
  User
} from './firebase';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Project {
  id: number;
  category: string;
  subCategory?: string;
  isPortfolio?: boolean;
  title: string;
  description: string;
  image: string;
  layout?: any;
  categoryLayout?: any;
}

function EditableSubCategory({ subCategory, isActive, isAdmin, onClick, onContextMenu, onSave }: { subCategory: string; isActive: boolean; isAdmin: boolean; onClick: () => void; onContextMenu: (e: React.MouseEvent) => void; onSave: (newName: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(subCategory);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  if (isEditing && isAdmin) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          setIsEditing(false);
          if (value !== subCategory) onSave(value);
          else setValue(subCategory);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setIsEditing(false);
            if (value !== subCategory) onSave(value);
            else setValue(subCategory);
          }
        }}
        className="text-sm font-medium tracking-widest uppercase bg-transparent outline-none w-full"
      />
    );
  }

  return (
    <button
      onClick={onClick}
      onDoubleClick={() => isAdmin && setIsEditing(true)}
      onContextMenu={onContextMenu}
      className={cn(
        "text-sm font-medium tracking-widest uppercase transition-colors duration-300 text-left",
        isActive ? "opacity-100" : "opacity-40 hover:opacity-100"
      )}
    >
      {subCategory}
    </button>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<'main' | 'category' | 'detail'>('main');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('##');
  const [isCategoryEditMode, setIsCategoryEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previousPage, setPreviousPage] = useState<'main' | 'category'>('main');
  const [categories, setCategories] = useState<string[]>(['##', 'Data Visualization & Information Design', '@']);
  const [subCategories, setSubCategories] = useState<Record<string, string[]>>({
    '##': ['1주차', '2주차', '3주차'],
    'Data Visualization & Information Design': [],
    '@': []
  });
  const [activeSubCategory, setActiveSubCategory] = useState<string>('1주차');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, target: string, type: 'category' | 'subCategory' | 'emptyPage' | 'portfolio' } | null>(null);
  const [profile, setProfile] = useState({ 
    name: "eveyul", 
    intro: "Interactive Designer & Developer", 
    contact: "hello@eveyul.com",
    introWidth: 250,
    introLineHeight: 1.6
  });
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const isAdmin = user?.email === 'eveyul0224@sookmyung.ac.kr';

  const diceSceneRef = useRef<DiceScene | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const categoryContainerRef = useRef<HTMLDivElement>(null);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const saveData = async (updatedProjects: Project[], updatedCategories: string[], updatedSubCategories: Record<string, string[]>) => {
    if (!isAdmin) return;
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setIsSaving(true);
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        // Save projects to Firestore
        const batch = updatedProjects.map(p => 
          setDoc(doc(db, 'projects', p.id.toString()), p)
        );
        
        // Save metadata (categories, subcategories)
        const metadataPromise = setDoc(doc(db, 'metadata', 'structure'), {
          categories: updatedCategories,
          subCategories: updatedSubCategories
        });

        await Promise.all([...batch, metadataPromise]);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'projects/metadata');
      } finally {
        setIsSaving(false);
      }
    }, 1000);
  };

  const saveProfile = async (updatedProfile: any) => {
    if (!isAdmin) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'profile', 'main'), updatedProfile);
      setProfile(updatedProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'profile/main');
    } finally {
      setIsSaving(false);
    }
  };

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Fetch projects
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const projectsData = snapshot.docs.map(doc => doc.data() as Project);
      if (projectsData.length > 0) {
        setProjects(projectsData.sort((a, b) => b.id - a.id));
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'projects'));

    // Fetch profile
    const unsubProfile = onSnapshot(doc(db, 'profile', 'main'), (snapshot) => {
      if (snapshot.exists()) {
        setProfile(snapshot.data() as any);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'profile/main'));

    // Fetch metadata
    const unsubMetadata = onSnapshot(doc(db, 'metadata', 'structure'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.categories) setCategories(data.categories);
        if (data.subCategories) setSubCategories(data.subCategories);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'metadata/structure'));

    return () => {
      unsubProjects();
      unsubProfile();
      unsubMetadata();
    };
  }, []);

  const handleCategoryHover = (category: string) => {
    if (diceSceneRef.current) {
      diceSceneRef.current.setRotation(category);
    }
  };

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    setCurrentPage('category');
    window.scrollTo(0, 0);
  };

  const handleProjectClick = (project: Project) => {
    setPreviousPage(currentPage === 'category' ? 'category' : 'main');
    setSelectedProject(project);
    setCurrentPage('detail');
    window.scrollTo(0, 0);
  };

  const handleAddProject = (category: string, isPortfolio: boolean = false) => {
    const newProject: Project = {
      id: Date.now(),
      title: "New Project",
      description: "Project Description",
      image: "https://picsum.photos/seed/new/800/1200",
      category: category,
      isPortfolio: isPortfolio,
      layout: {
        heroImg: { x: 0, y: 0, width: 600, height: 600, src: "https://picsum.photos/seed/new/800/1200", wrapText: false }
      }
    };
    
    setProjects(prev => {
      const updatedProjects = [...prev, newProject];
      
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      setIsSaving(true);
      saveTimeoutRef.current = setTimeout(() => {
        fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProjects)
        }).finally(() => setIsSaving(false));
      }, 1000);

      return updatedProjects;
    });
  };

  const handleBack = () => {
    setCurrentPage(previousPage);
    if (previousPage === 'main') {
      setTimeout(() => {
        document.getElementById('projects-section')?.scrollIntoView({ behavior: 'instant' });
      }, 50);
    }
  };

  const handleDeleteProject = (projectId: number) => {
    setProjects(prev => {
      const updatedProjects = prev.filter(p => p.id !== projectId);
      
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      setIsSaving(true);
      saveTimeoutRef.current = setTimeout(() => {
        fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProjects)
        })
        .then(res => {
          if (!res.ok) throw new Error("Failed to save");
          console.log("Saved successfully");
        })
        .catch(error => {
          console.error("Failed to persist project updates:", error);
        })
        .finally(() => {
          setIsSaving(false);
        });
      }, 1000);

      return updatedProjects;
    });
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(prev => {
      const updatedProjects = prev.map(p => p.id === updatedProject.id ? updatedProject : p);
      
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      setIsSaving(true);
      saveTimeoutRef.current = setTimeout(() => {
        fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProjects)
        })
        .then(res => {
          if (!res.ok) throw new Error("Failed to save");
          console.log("Saved successfully");
        })
        .catch(error => {
          console.error("Failed to persist project updates:", error);
        })
        .finally(() => {
          setIsSaving(false);
        });
      }, 1000);

      return updatedProjects;
    });
    setSelectedProject(prev => prev?.id === updatedProject.id ? updatedProject : prev);
  };

  const handleContextMenu = (e: React.MouseEvent, target: string, type: 'category' | 'subCategory' | 'emptyPage' | 'portfolio') => {
    if (!isAdmin) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, target, type });
  };

  useEffect(() => {
    if (subCategories[activeCategory] && subCategories[activeCategory].length === 0) {
      const newSub = '1주차';
      const updatedSubCategories = { ...subCategories, [activeCategory]: [newSub] };
      setSubCategories(updatedSubCategories);
      setActiveSubCategory(newSub);
      saveData(projects, categories, updatedSubCategories);
    } else if (subCategories[activeCategory] && subCategories[activeCategory].length > 0) {
      if (!subCategories[activeCategory].includes(activeSubCategory)) {
        setActiveSubCategory(subCategories[activeCategory][0]);
      }
    }
  }, [activeCategory]);

  const changeCategory = (cat: string) => {
    setActiveCategory(cat);
    if (subCategories[cat] && subCategories[cat].length > 0) {
      setActiveSubCategory(subCategories[cat][0]);
    }
  };

  const handleEdit = () => {
    const newName = prompt("Enter new name:", contextMenu?.target);
    if (newName && newName !== contextMenu?.target) {
      if (contextMenu?.type === 'category') {
        const oldName = contextMenu?.target;
        const updatedCategories = categories.map(c => c === oldName ? newName : c);
        setCategories(updatedCategories);
        
        // Update projects
        const updatedProjects = projects.map(p => p.category === oldName ? { ...p, category: newName } : p);
        setProjects(updatedProjects);
        
        // Update subCategories map
        const updatedSubCategories = { ...subCategories, [newName]: subCategories[oldName] || [] };
        delete updatedSubCategories[oldName];
        setSubCategories(updatedSubCategories);
        
        if (activeCategory === oldName) changeCategory(newName);
        saveData(updatedProjects, updatedCategories, updatedSubCategories);
      } else if (contextMenu?.type === 'subCategory') {
        const oldName = contextMenu?.target;
        // Use activeCategory instead of searching to avoid picking the wrong category if names overlap
        const categoryOfSub = activeCategory;
        if (categoryOfSub && subCategories[categoryOfSub]?.includes(oldName)) {
          const currentSubs = subCategories[categoryOfSub] || [];
          const updatedSubCategories = { 
            ...subCategories, 
            [categoryOfSub]: currentSubs.map(s => s === oldName ? newName : s)
          };
          setSubCategories(updatedSubCategories);
          
          // Update projects
          const updatedProjects = projects.map(p => p.category === categoryOfSub && p.subCategory === oldName ? { ...p, subCategory: newName } : p);
          setProjects(updatedProjects);
          
          if (activeSubCategory === oldName) setActiveSubCategory(newName);
          saveData(updatedProjects, categories, updatedSubCategories);
        }
      }
    }
    setContextMenu(null);
  };

  const handleSubCategoryDoubleClick = (subCat: string) => {
    const newName = prompt("Enter new name:", subCat);
    if (newName && newName !== subCat) {
      const categoryOfSub = activeCategory;
      if (categoryOfSub && subCategories[categoryOfSub]?.includes(subCat)) {
        const currentSubs = subCategories[categoryOfSub] || [];
        const updatedSubCategories = { 
          ...subCategories, 
          [categoryOfSub]: currentSubs.map(s => s === subCat ? newName : s)
        };
        setSubCategories(updatedSubCategories);
        
        // Update projects
        const updatedProjects = projects.map(p => p.category === categoryOfSub && p.subCategory === subCat ? { ...p, subCategory: newName } : p);
        setProjects(updatedProjects);
        
        if (activeSubCategory === subCat) setActiveSubCategory(newName);
        saveData(updatedProjects, categories, updatedSubCategories);
      }
    }
  };

  // ... (inside render)
  // Inside nav:
  // onClick={() => changeCategory(cat)}
  // ... (inside subCategory list)
  // onDoubleClick={() => handleSubCategoryDoubleClick(subCat)}

  // Inside ProjectDetail:
  // className={cn(
  //   "min-h-screen w-full bg-black pb-48 transition-colors duration-500",
  //   isEditMode ? "bg-gray-900" : "bg-black"
  // )}

  const handleDelete = () => {
    if (confirm("Are you sure?")) {
      if (contextMenu?.type === 'category') {
        const target = contextMenu?.target;
        const updatedCategories = categories.filter(c => c !== target);
        setCategories(updatedCategories);
        
        // Remove projects in this category
        const updatedProjects = projects.filter(p => p.category !== target);
        setProjects(updatedProjects);
        
        // Remove subCategories
        const updatedSubCategories = { ...subCategories };
        delete updatedSubCategories[target];
        setSubCategories(updatedSubCategories);
        
        if (activeCategory === target) setActiveCategory(updatedCategories[0]);
        saveData(updatedProjects, updatedCategories, updatedSubCategories);
      } else if (contextMenu?.type === 'subCategory') {
        const target = contextMenu?.target;
        // Use activeCategory instead of searching
        const categoryOfSub = activeCategory;
        if (categoryOfSub && subCategories[categoryOfSub]?.includes(target)) {
          const currentSubs = subCategories[categoryOfSub] || [];
          const updatedSubCategories = { 
            ...subCategories, 
            [categoryOfSub]: currentSubs.filter(s => s !== target)
          };
          setSubCategories(updatedSubCategories);
          
          // Remove projects in this subCategory
          const updatedProjects = projects.filter(p => !(p.category === categoryOfSub && p.subCategory === target));
          setProjects(updatedProjects);
          
          if (activeSubCategory === target) setActiveSubCategory(updatedSubCategories[categoryOfSub][0] || '1주차');
          saveData(updatedProjects, categories, updatedSubCategories);
        }
      }
    }
    setContextMenu(null);
  };

  const handleAddContent = (type: 'image' | 'text') => {
    let x = 0;
    let y = 0;
    if (contextMenu && categoryContainerRef.current) {
      const rect = categoryContainerRef.current.getBoundingClientRect();
      x = contextMenu.x - rect.left;
      y = contextMenu.y - rect.top;
    }

    const newProject: Project = {
      id: Date.now(),
      title: type === 'image' ? "New Image" : "New Text",
      description: type === 'image' ? "Image Description" : "Text Description",
      image: type === 'image' ? "https://picsum.photos/seed/new/800/1200" : "",
      category: activeCategory,
      subCategory: activeSubCategory,
      layout: {
        ...(type === 'image' ? {
          heroImg: { x, y, width: 600, height: 600, src: "https://picsum.photos/seed/new/800/1200", wrapText: false }
        } : {
          mainText: { x, y, width: 400, fontSize: 18, fontWeight: 400, fontFamily: 'Inter', value: "New Text", color: '#E2E2E2' }
        })
      },
      categoryLayout: {
        ...(type === 'image' ? {
          img: { x, y, width: 600, height: 337, src: "https://picsum.photos/seed/new/800/1200" }
        } : {
          mainText: { x, y, width: 400, fontSize: 18, fontWeight: 400, fontFamily: 'Inter', value: "New Text", color: '#000000' }
        }),
        extraElements: []
      }
    };
    
    setProjects(prev => {
      const updatedProjects = [...prev, newProject];
      saveData(updatedProjects, categories, subCategories);
      return updatedProjects;
    });
    setContextMenu(null);
  };

  return (
    <div className="relative min-h-screen font-sans bg-white" onClick={() => setContextMenu(null)}>
      {contextMenu && (
        <div 
          className="fixed z-[200] bg-white text-black shadow-2xl rounded-xl border border-gray-100 p-2 min-w-[150px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'portfolio' ? (
            <button onClick={() => { handleAddProject(activeCategory, true); setContextMenu(null); }} className="w-full text-left p-2 hover:bg-gray-100 font-bold uppercase tracking-widest text-xs">Add Project</button>
          ) : contextMenu.type === 'emptyPage' ? (
            <>
              <button onClick={() => handleAddContent('image')} className="w-full text-left p-2 hover:bg-gray-100">Add Image</button>
              <button onClick={() => handleAddContent('text')} className="w-full text-left p-2 hover:bg-gray-100">Add Text</button>
            </>
          ) : contextMenu.type === 'subCategory' ? (
            <div className="p-2 text-sm text-gray-500">No actions available</div>
          ) : (
            <>
              <button onClick={handleEdit} className="w-full text-left p-2 hover:bg-gray-100">Edit</button>
              <button onClick={handleDelete} className="w-full text-left p-2 hover:bg-red-50 text-red-600">Delete</button>
            </>
          )}
        </div>
      )}
      <div className="grain-overlay" />
      {/* Auth Button */}
      <div className="fixed top-6 right-6 z-[100]">
        {user ? (
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-full transition-all text-xs font-medium border border-white/10"
          >
            <LogOut size={14} />
            {user.email}
          </button>
        ) : (
          <button 
            onClick={handleLogin}
            className="flex items-center gap-2 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-full transition-all text-xs font-medium border border-white/10"
          >
            <LogIn size={14} />
            Login
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {currentPage === 'main' ? (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full bg-white"
          >
            {/* Hero Section */}
            <motion.section 
              style={{ opacity: heroOpacity }}
              className="relative flex h-screen w-full items-center justify-center overflow-hidden"
            >
              {/* Top Left Logo */}
              <div className="absolute top-12 left-12 z-50">
                <h1 
                  className="font-bold tracking-tighter uppercase glow-text"
                  style={{ fontFamily: 'Courier New', fontSize: '35px' }}
                >
                  eveyul
                </h1>
              </div>

              {/* 3D Dice Container */}
              <DiceComponent onMount={(scene) => { diceSceneRef.current = scene; }} />

              {/* Right Navigation Bar */}
              <nav className="absolute right-12 top-1/2 -translate-y-1/2 flex flex-col items-end gap-12 z-50">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onMouseEnter={() => handleCategoryHover(cat)}
                    onClick={() => handleCategoryClick(cat)}
                    onContextMenu={(e) => handleContextMenu(e, cat, 'category')}
                    className={cn(
                      "text-right transition-all duration-500 ease-in-out cursor-pointer group",
                      "text-sm font-medium tracking-widest uppercase",
                      activeCategory === cat ? "text-[#191f28]" : "text-gray-300 hover:text-[#191f28]"
                    )}
                  >
                    <span className="block transform group-hover:-translate-x-2 transition-transform duration-300">
                      {cat}
                    </span>
                  </button>
                ))}
              </nav>

              {/* Bottom Left Profile */}
              <div className="absolute bottom-12 left-12 z-50">
                <ProfileEditor 
                  profile={profile} 
                  onSave={saveProfile} 
                  isAdmin={isAdmin}
                />
              </div>
            </motion.section>

            {/* Projects Section */}
            <motion.section 
              initial={{ backgroundColor: "#ffffff" }}
              whileInView={{ backgroundColor: "#131313" }}
              transition={{ duration: 1 }}
              id="projects-section" 
              className="min-h-screen w-full text-white relative z-10 pt-24 pb-24 px-12"
              onContextMenu={(e) => handleContextMenu(e, '', 'portfolio')}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-[1400px] mx-auto">
                {projects.length === 0 || projects.filter(p => p.isPortfolio === true).length === 0 ? (
                  <div className="col-span-4 py-20 flex flex-col items-center justify-center gap-4 opacity-50">
                    <p>No projects found.</p>
                  </div>
                ) : projects.filter(p => p.isPortfolio === true).map((project, index) => (
                    <PortfolioGridItem 
                      key={project.id} 
                      project={project} 
                      index={index} 
                      isAdmin={isAdmin}
                      onClick={() => handleProjectClick(project)}
                      onUpdateProject={handleUpdateProject}
                      onAddProject={() => handleAddProject(activeCategory, true)}
                      onDeleteProject={() => handleDeleteProject(project.id)}
                    />
                  ))}
              </div>

              {/* Contact Footer */}
              <div className="mt-32 pt-12 border-t border-white/20 flex flex-col items-start w-full max-w-[1400px] mx-auto">
                <h3 className="text-[15px] font-[system-ui] font-bold uppercase tracking-widest mb-4">Contact</h3>
                <input
                  value={(profile as any).contact || "hello@eveyul.com"}
                  readOnly={!isAdmin}
                  onChange={(e) => isAdmin && setProfile({...profile, contact: e.target.value})}
                  onBlur={() => isAdmin && saveProfile(profile)}
                  className={cn(
                    "text-[19px] font-[system-ui] font-light outline-none bg-transparent w-full max-w-md text-white",
                    isAdmin ? "cursor-text" : "cursor-default"
                  )}
                  placeholder="Enter your email or contact info"
                />
              </div>
            </motion.section>
          </motion.div>
        ) : currentPage === 'category' ? (
          <motion.div
            key="category"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen w-full bg-white text-black"
          >
            {/* Header */}
            <header className="fixed top-0 left-0 w-full p-12 flex justify-between items-center z-50 mix-blend-difference text-white">
              <button 
                onClick={() => setCurrentPage('main')}
                className="font-bold tracking-tighter uppercase cursor-pointer"
                style={{ fontFamily: 'Courier New', fontSize: '35px' }}
              >
                eveyul
              </button>
              
              <nav className="flex gap-8">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => changeCategory(cat)}
                    onContextMenu={(e) => handleContextMenu(e, cat, 'category')}
                    className={cn(
                      "text-sm font-medium tracking-widest uppercase transition-colors duration-300",
                      activeCategory === cat ? "opacity-100" : "opacity-40 hover:opacity-100"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </nav>
            </header>

            {/* Sidebar */}
            <aside className="fixed right-12 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4">
              {(subCategories[activeCategory] || []).map((sub) => (
                <EditableSubCategory
                  key={sub}
                  subCategory={sub}
                  isActive={activeSubCategory === sub}
                  isAdmin={isAdmin}
                  onClick={() => setActiveSubCategory(sub)}
                  onContextMenu={(e: React.MouseEvent) => handleContextMenu(e, sub, 'subCategory')}
                  onSave={(newName) => {
                    const categoryOfSub = activeCategory;
                    if (categoryOfSub) {
                      const currentSubs = subCategories[categoryOfSub] || [];
                      const updatedSubCategories = { 
                        ...subCategories, 
                        [categoryOfSub]: currentSubs.map(s => s === sub ? newName : s)
                      };
                      setSubCategories(updatedSubCategories);
                      
                      // Update projects
                      const updatedProjects = projects.map(p => p.category === categoryOfSub && (p.subCategory || '1주차') === sub ? { ...p, subCategory: newName } : p);
                      setProjects(updatedProjects);
                      
                      if (activeSubCategory === sub) setActiveSubCategory(newName);
                      saveData(updatedProjects, categories, updatedSubCategories);
                    }
                  }}
                />
              ))}
              {isAdmin && (
                <button onClick={() => {
                  const currentSubs = subCategories[activeCategory] || [];
                  const newSub = `${currentSubs.length + 1}주차`;
                  const updatedSubCategories = { ...subCategories, [activeCategory]: [...currentSubs, newSub] };
                  setSubCategories(updatedSubCategories);
                  saveData(projects, categories, updatedSubCategories);
                }} className="opacity-40 hover:opacity-100">+</button>
              )}
            </aside>

            {/* Project List */}
            <div ref={categoryContainerRef} className="pt-48 pb-24 px-12 max-w-5xl mx-auto">
              {/* Floating Action Button for Edit Mode */}
              {isAdmin && (
                <button
                  onClick={() => setIsCategoryEditMode(!isCategoryEditMode)}
                  className={cn(
                    "fixed bottom-12 right-12 w-16 h-16 rounded-full flex items-center justify-center z-[100] shadow-2xl transition-all duration-500",
                    isCategoryEditMode ? "bg-black text-white rotate-0" : "bg-white text-black hover:scale-110"
                  )}
                >
                  {isCategoryEditMode ? <Check size={24} /> : <Edit2 size={24} />}
                </button>
              )}
              {isSaving && (
                <div className="fixed bottom-32 right-12 z-[100]">
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-50 animate-pulse bg-white px-2 py-1 rounded">
                    Saving...
                  </span>
                </div>
              )}
              
                  {projects.filter(p => p.category === activeCategory && (p.subCategory || '1주차') === activeSubCategory && !p.isPortfolio).length === 0 ? (
                <div 
                  className="py-20 flex flex-col items-center justify-center gap-4 opacity-50 cursor-context-menu"
                  onContextMenu={(e) => handleContextMenu(e, '', 'emptyPage')}
                >
                  <p>No projects found. Right click to add content.</p>
                </div>
              ) : (
                <>
                  {projects
                    .filter(p => p.category === activeCategory && (p.subCategory || '1주차') === activeSubCategory && !p.isPortfolio)
                    .map((project, index) => (
                      <CategoryBlogBlock 
                        key={project.id} 
                        project={project} 
                        index={index} 
                        onClick={() => handleProjectClick(project)}
                        isEditMode={isCategoryEditMode}
                        onUpdateProject={handleUpdateProject}
                      />
                    ))}
                </>
              )}
            </div>
          </motion.div>
        ) : (
          <ProjectDetail 
            key="detail"
            project={selectedProject!} 
            isAdmin={isAdmin}
            onBack={handleBack} 
            onUpdateProject={handleUpdateProject}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DiceComponent({ onMount }: { onMount: (scene: DiceScene) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const scene = new DiceScene(containerRef.current);
      onMount(scene);
      return () => {
        scene.destroy();
      };
    }
  }, [onMount]);

  return (
    <div 
      ref={containerRef} 
      className="w-[60vw] h-[60vh] flex items-center justify-center"
    />
  );
}

function PortfolioGridItem({ project, index, isAdmin, onClick, onUpdateProject, onAddProject, onDeleteProject }: { project: Project; index: number; isAdmin: boolean; onClick: () => void; onUpdateProject: (p: Project) => void; onAddProject: () => void; onDeleteProject: () => void; }) {
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(project.title);
  const [editDesc, setEditDesc] = useState(project.description);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditTitle(project.title);
    setEditDesc(project.description);
  }, [project.title, project.description]);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onUpdateProject({ ...project, image: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 4) * 0.1 }}
      className="flex flex-col gap-4 relative group"
    >
      <div 
        className="aspect-[3/4] w-full bg-gray-900 overflow-hidden relative cursor-pointer"
        onClick={onClick}
        onContextMenu={handleContextMenu}
      >
        {project.image && (
          <img 
            src={project.image} 
            alt={project.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
          />
        )}
        <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded uppercase tracking-widest pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          Right Click to Edit
        </div>
      </div>
      <div 
        className="flex flex-col gap-1" 
        onDoubleClick={() => setIsEditing(true)}
      >
        {isEditing ? (
          <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="bg-zinc-800 text-white text-sm font-medium tracking-tight p-1 rounded outline-none w-full font-['Verdana']"
              autoFocus
              placeholder="Title"
            />
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="bg-zinc-800 text-white text-xs p-1 rounded outline-none w-full min-h-[60px]"
              placeholder="Description"
            />
            <div className="flex gap-2 mt-1">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateProject({ ...project, title: editTitle, description: editDesc });
                  setIsEditing(false);
                }}
                className="text-[10px] uppercase font-bold bg-white text-black px-2 py-1 rounded hover:bg-gray-200 transition-colors"
              >
                Save
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setEditTitle(project.title);
                  setEditDesc(project.description);
                  setIsEditing(false);
                }}
                className="text-[10px] uppercase font-bold bg-zinc-700 text-white px-2 py-1 rounded hover:bg-zinc-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="font-medium text-sm tracking-tight font-['Verdana'] text-[#F2F2F2]">{project.title}</h3>
            <p className="text-xs text-gray-400 line-clamp-2">{project.description}</p>
            <div className="text-[8px] uppercase tracking-widest opacity-0 group-hover:opacity-30 transition-opacity mt-1">
              Double click to edit text
            </div>
          </>
        )}
      </div>

      {contextMenu && (
        <div 
          className="fixed z-[200] bg-white text-black shadow-2xl rounded-xl border border-gray-100 p-2 min-w-[150px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button 
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); setContextMenu(null); }}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm font-bold uppercase tracking-widest"
          >
            이미지 수정
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onAddProject(); setContextMenu(null); }}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm font-bold uppercase tracking-widest"
          >
            작업물 추가
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDeleteProject(); setContextMenu(null); }}
            className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-500 rounded-lg text-sm font-bold uppercase tracking-widest"
          >
            작업물 삭제
          </button>
        </div>
      )}
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
    </motion.div>
  );
}

function CategoryBlogBlock({ project, index, onClick, isEditMode, onUpdateProject }: { project: Project; index: number; onClick: () => void; isEditMode: boolean; onUpdateProject: (p: Project) => void; }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [layout, setLayout] = useState<any>(project.categoryLayout || {
    ...(project.image ? { img: { x: 0, y: 0, width: 600, height: 337, src: project.image } } : {
      mainText: { x: 0, y: 0, width: 400, fontSize: 18, fontWeight: 400, fontFamily: 'Inter', value: `${project.title}\n\n${project.description}`, color: '#000000' }
    }),
    extraElements: []
  });

  const updateLayout = (key: string, value: any) => {
    const newLayout = {
      ...layout,
      [key]: { ...layout[key], ...value }
    };
    setLayout(newLayout);
    
    const updatedProject = { ...project, categoryLayout: newLayout };
    if (key === 'mainText' && value.value) {
      const lines = value.value.split('\n');
      updatedProject.title = lines[0] || "Untitled";
      updatedProject.description = lines.slice(1).join('\n').trim();
    }
    
    onUpdateProject(updatedProject);
  };

  const updateExtraText = (id: number, value: any) => {
    const newLayout = {
      ...layout,
      extraElements: layout.extraElements.map((el: any) => el.id === id ? { ...el, ...value } : el)
    };
    setLayout(newLayout);
    onUpdateProject({ ...project, categoryLayout: newLayout });
  };

  const deleteExtraText = (id: number) => {
    const newLayout = {
      ...layout,
      extraElements: layout.extraElements.filter((el: any) => el.id !== id)
    };
    setLayout(newLayout);
    onUpdateProject({ ...project, categoryLayout: newLayout });
  };

  const addExtraText = (clientX: number, clientY: number) => {
    if (!isEditMode || !sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const newElement = {
      id: Date.now(),
      x,
      y,
      width: 'auto',
      fontSize: 16,
      fontFamily: 'Inter',
      lineHeight: 1.5,
      value: 'New Text',
      color: '#000000'
    };

    const newLayout = {
      ...layout,
      extraElements: [...(layout.extraElements || []), newElement]
    };
    setLayout(newLayout);
    onUpdateProject({ ...project, categoryLayout: newLayout });
  };

  const addExtraImage = (clientX: number, clientY: number) => {
    if (!isEditMode || !sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const newElement = {
      id: Date.now(),
      x,
      y,
      width: 200,
      height: 200,
      src: 'https://picsum.photos/200/200'
    };

    const newLayout = {
      ...layout,
      extraElements: [...(layout.extraElements || []), { ...newElement, type: 'image' }]
    };
    setLayout(newLayout);
    onUpdateProject({ ...project, categoryLayout: newLayout });
  };

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <motion.section
      ref={sectionRef as any}
      className="mb-48 last:mb-0 relative min-h-[600px]"
      onContextMenu={handleContextMenu}
      onClick={() => setContextMenu(null)}
    >
      {contextMenu && (
        <div 
          className="fixed z-[200] bg-white shadow-2xl rounded-xl border border-gray-100 p-2 min-w-[150px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button 
            onClick={() => { addExtraText(contextMenu.x, contextMenu.y); setContextMenu(null); }}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm font-bold uppercase tracking-widest"
          >
            Add Text
          </button>
          <button 
            onClick={() => { addExtraImage(contextMenu.x, contextMenu.y); setContextMenu(null); }}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm font-bold uppercase tracking-widest"
          >
            Add Image
          </button>
        </div>
      )}
      {!layout.img?.deleted && layout.img && (
        <EditableImage
          layout={layout.img}
          isEditMode={isEditMode}
          onChange={(l: any) => updateLayout('img', l)}
          onDelete={() => updateLayout('img', { deleted: true })}
          onClick={onClick}
          className="rounded-3xl overflow-hidden bg-gray-100 shadow-sm"
        />
      )}
      {!layout.mainText?.deleted && layout.mainText && (
        <EditableText
          layout={layout.mainText}
          isEditMode={isEditMode}
          fonts={['Inter', 'Courier New', 'Georgia', 'Playfair Display', 'JetBrains Mono', 'Anton']}
          onChange={(s: any) => updateLayout('mainText', s)}
          onDelete={() => updateLayout('mainText', { deleted: true })}
          className="leading-relaxed"
          color="#000000"
        />
      )}
      {layout.extraElements?.map((el: any) => (
        el.type === 'image' ? (
          <EditableImage
            key={el.id}
            layout={el}
            isEditMode={isEditMode}
            onChange={(val: any) => updateExtraText(el.id, val)}
            onDelete={() => deleteExtraText(el.id)}
            className="rounded-xl overflow-hidden bg-gray-100 shadow-sm"
          />
        ) : (
          <EditableText
            key={el.id}
            layout={el}
            isEditMode={isEditMode}
            fonts={['Inter', 'Courier New', 'Georgia', 'Playfair Display', 'JetBrains Mono', 'Anton']}
            onChange={(val: any) => updateExtraText(el.id, val)}
            onDelete={() => deleteExtraText(el.id)}
            className="z-[60]"
            color="#000000"
          />
        )
      ))}
    </motion.section>
  );
}

function ProjectDetail({ project, isAdmin, onBack, onUpdateProject }: { project: Project; isAdmin: boolean; onBack: () => void; onUpdateProject: (p: Project) => void }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [layout, setLayout] = useState<any>(project.layout || {
    heroImg: { x: 0, y: 0, width: 600, height: 600, src: project.image, wrapText: false },
    gridImg1: { x: 0, y: 0, width: 800, height: 450, src: `https://picsum.photos/seed/${project.id}-1/1200/800`, wrapText: false },
    gridImg2: { x: 0, y: 0, width: 400, height: 600, src: `https://picsum.photos/seed/${project.id}-2/800/1200`, wrapText: false },
    fullImg: { x: 0, y: 0, width: 1100, height: 600, src: `https://picsum.photos/seed/${project.id}-3/1600/700`, wrapText: false },
    techImg: { x: 0, y: 0, width: 600, height: 400, src: `https://picsum.photos/seed/${project.id}-4/1000/600`, wrapText: false },
    mainText: { x: 650, y: 0, width: 400, fontSize: 20, fontWeight: 400, fontFamily: 'Inter', lineHeight: 1.6, value: `${project.title}\n\n${project.description}`, color: '#E2E2E2' },
    philosophyText: { x: 0, y: 50, width: 600, fontSize: 18, fontWeight: 400, fontFamily: 'Inter', lineHeight: 1.7, value: "Design Philosophy\n\nThis project focuses on the seamless integration of complex data sets into a visually intuitive interface. By leveraging advanced rendering techniques and careful information hierarchy, we've created an experience that is both functional and aesthetically profound. The goal was to minimize cognitive load while maximizing the emotional impact of the data.", color: '#E2E2E2' },
    techText: { x: 650, y: 50, width: 400, fontSize: 16, fontWeight: 400, fontFamily: 'Inter', lineHeight: 1.7, value: "Technical Implementation\n\nUtilizing custom shaders and real-time data processing, the system maintains high performance even with thousands of concurrent data points. The architecture is built for scalability and future-proofing, ensuring a consistent experience across all devices.", color: '#E2E2E2' },
    extraElements: []
  });

  const fonts = ['Inter', 'Courier New', 'Georgia', 'Playfair Display', 'JetBrains Mono', 'Anton'];

  const updateLayout = (key: string, value: any) => {
    setLayout((prev: any) => ({
      ...prev,
      [key]: { ...prev[key], ...value }
    }));
  };

  const [contextMenu, setContextMenu] = useState<{ clientX: number, clientY: number, relX: number, relY: number } | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!isAdmin || !isEditMode) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenu({ 
      clientX: e.clientX, 
      clientY: e.clientY,
      relX: e.clientX - rect.left,
      relY: e.clientY - rect.top
    });
  };

  const addExtraText = () => {
    if (!contextMenu) return;
    const newElement = {
      id: Date.now(),
      x: contextMenu.relX,
      y: contextMenu.relY,
      width: 300,
      fontSize: 16,
      fontWeight: 400,
      fontFamily: 'Inter',
      lineHeight: 1.5,
      value: 'Type something...',
      color: '#E2E2E2'
    };

    setLayout((prev: any) => ({
      ...prev,
      extraElements: [...(prev.extraElements || []), newElement]
    }));
    setContextMenu(null);
  };

  const addExtraImage = () => {
    if (!contextMenu) return;
    const newElement = {
      id: Date.now(),
      type: 'image',
      x: contextMenu.relX,
      y: contextMenu.relY,
      width: 300,
      height: 300,
      src: 'https://picsum.photos/300/300'
    };

    setLayout((prev: any) => ({
      ...prev,
      extraElements: [...(prev.extraElements || []), newElement]
    }));
    setContextMenu(null);
  };

  const updateExtraText = (id: number, value: any) => {
    setLayout((prev: any) => ({
      ...prev,
      extraElements: prev.extraElements.map((el: any) => el.id === id ? { ...el, ...value } : el)
    }));
  };

  const deleteExtraText = (id: number) => {
    setLayout((prev: any) => ({
      ...prev,
      extraElements: prev.extraElements.filter((el: any) => el.id !== id)
    }));
  };

  const handleToggleEdit = () => {
    if (isEditMode) {
      // Save changes
      onUpdateProject({
        ...project,
        title: layout.mainText?.value ? layout.mainText.value.split('\n')[0] : project.title,
        description: layout.mainText?.value ? layout.mainText.value.split('\n').slice(1).join('\n').trim() : project.description,
        layout: layout
      });
    }
    setIsEditMode(!isEditMode);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "min-h-screen w-full bg-[#131313] pb-48 transition-colors duration-500",
        isEditMode ? "bg-gray-900" : "bg-[#131313]"
      )}
    >
      {/* Detail Header */}
      <header className="fixed top-0 left-0 w-full p-12 flex justify-between items-center z-50 mix-blend-difference text-white">
        <button 
          onClick={onBack}
          className="font-bold tracking-tighter uppercase cursor-pointer"
          style={{ fontFamily: 'Courier New', fontSize: '35px' }}
        >
          eveyul
        </button>
        <button 
          onClick={onBack}
          className="text-sm font-medium tracking-widest uppercase opacity-60 hover:opacity-100 transition-opacity"
        >
          Back
        </button>
      </header>

      {/* Floating Action Button */}
      {isAdmin && (
        <button
          onClick={handleToggleEdit}
          className={cn(
            "fixed bottom-12 right-12 w-16 h-16 rounded-full flex items-center justify-center z-[100] shadow-2xl transition-all duration-500",
            isEditMode ? "bg-black text-white rotate-0" : "bg-white text-black hover:scale-110"
          )}
        >
          {isEditMode ? <Check size={24} /> : <Edit2 size={24} />}
        </button>
      )}

      {/* Editorial Content */}
      <article 
        onContextMenu={handleContextMenu}
        onClick={() => setContextMenu(null)}
        className={cn(
          "pt-48 px-12 max-w-6xl mx-auto flex flex-col gap-32 relative",
          isEditMode && "cursor-text"
        )}
      >
        {contextMenu && (
          <div 
            className="fixed z-[200] bg-white shadow-2xl rounded-xl border border-gray-100 p-2 min-w-[150px]"
            style={{ left: contextMenu.clientX, top: contextMenu.clientY }}
          >
            <button 
              onClick={addExtraText}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm font-bold uppercase tracking-widest"
            >
              Add Text
            </button>
            <button 
              onClick={addExtraImage}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm font-bold uppercase tracking-widest"
            >
              Add Image
            </button>
          </div>
        )}
        {/* Extra Elements Layer */}
        {layout.extraElements?.map((el: any) => (
          el.type === 'image' ? (
            <EditableImage
              key={el.id}
              layout={el}
              isEditMode={isEditMode}
              onChange={(val: any) => updateExtraText(el.id, val)}
              onDelete={() => deleteExtraText(el.id)}
              className="z-[60] rounded-xl overflow-hidden bg-gray-100 shadow-sm"
            />
          ) : (
            <EditableText
              key={el.id}
              layout={el}
              isEditMode={isEditMode}
              fonts={fonts}
              onChange={(val: any) => updateExtraText(el.id, val)}
              onDelete={() => deleteExtraText(el.id)}
              className="z-[60]"
            />
          )
        ))}
        {/* Main Hero Section */}
        <section className="relative min-h-[600px]">
          {!layout.mainText?.deleted && layout.mainText && (
            <EditableText
              layout={layout.mainText}
              isEditMode={isEditMode}
              fonts={fonts}
              onChange={(s: any) => updateLayout('mainText', s)}
              onDelete={() => updateLayout('mainText', { deleted: true })}
            />
          )}
          {/* Fallback for old layouts */}
          {!layout.title?.deleted && layout.title && (
            <EditableText
              layout={layout.title}
              isEditMode={isEditMode}
              fonts={fonts}
              onChange={(s: any) => updateLayout('title', s)}
              onDelete={() => updateLayout('title', { deleted: true })}
              className="font-bold tracking-tighter uppercase leading-[0.9]"
            />
          )}
          {!layout.desc?.deleted && layout.desc && (
            <EditableText
              layout={layout.desc}
              isEditMode={isEditMode}
              fonts={fonts}
              onChange={(s: any) => updateLayout('desc', s)}
              onDelete={() => updateLayout('desc', { deleted: true })}
              className="leading-relaxed font-light opacity-80"
            />
          )}
          {!layout.heroImg?.deleted && layout.heroImg && (
            <EditableImage
              layout={layout.heroImg}
              isEditMode={isEditMode}
              onChange={(l: any) => updateLayout('heroImg', l)}
              onDelete={() => updateLayout('heroImg', { deleted: true })}
              className="rounded-3xl overflow-hidden bg-gray-100 shadow-sm"
            />
          )}
        </section>

        {/* Grid Layout Section */}
        <section className="relative min-h-[800px]">
          {!layout.gridImg1?.deleted && layout.gridImg1 && (
            <EditableImage
              layout={layout.gridImg1}
              isEditMode={isEditMode}
              onChange={(l: any) => updateLayout('gridImg1', l)}
              onDelete={() => updateLayout('gridImg1', { deleted: true })}
              className="rounded-3xl overflow-hidden bg-gray-100 shadow-sm"
            />
          )}
          {!layout.gridImg2?.deleted && layout.gridImg2 && (
            <EditableImage
              layout={layout.gridImg2}
              isEditMode={isEditMode}
              onChange={(l: any) => updateLayout('gridImg2', l)}
              onDelete={() => updateLayout('gridImg2', { deleted: true })}
              className="rounded-3xl overflow-hidden bg-gray-100 shadow-sm"
            />
          )}
        </section>

        {/* Text Block */}
        <section className="relative min-h-[400px]">
          {!layout.philosophyTitle?.deleted && layout.philosophyTitle && (
            <EditableText
              layout={layout.philosophyTitle}
              isEditMode={isEditMode}
              fonts={fonts}
              onChange={(s: any) => updateLayout('philosophyTitle', s)}
              onDelete={() => updateLayout('philosophyTitle', { deleted: true })}
              className="font-bold uppercase"
            />
          )}
          {!layout.philosophyText?.deleted && layout.philosophyText && (
            <EditableText
              layout={layout.philosophyText}
              isEditMode={isEditMode}
              fonts={fonts}
              onChange={(s: any) => updateLayout('philosophyText', s)}
              onDelete={() => updateLayout('philosophyText', { deleted: true })}
              className="leading-relaxed opacity-70"
            />
          )}
        </section>

        {/* Full Width Image */}
        <section className="w-full relative h-[600px]">
          {!layout.fullImg?.deleted && layout.fullImg && (
            <EditableImage
              layout={layout.fullImg}
              isEditMode={isEditMode}
              onChange={(l: any) => updateLayout('fullImg', l)}
              onDelete={() => updateLayout('fullImg', { deleted: true })}
              className="rounded-3xl overflow-hidden bg-gray-100 shadow-sm"
            />
          )}
        </section>

        {/* Two Column Section */}
        <section className="relative min-h-[600px]">
          {!layout.techTitle?.deleted && layout.techTitle && (
            <EditableText
              layout={layout.techTitle}
              isEditMode={isEditMode}
              fonts={fonts}
              onChange={(s: any) => updateLayout('techTitle', s)}
              onDelete={() => updateLayout('techTitle', { deleted: true })}
              className="font-bold uppercase"
            />
          )}
          {!layout.techText?.deleted && layout.techText && (
            <EditableText
              layout={layout.techText}
              isEditMode={isEditMode}
              fonts={fonts}
              onChange={(s: any) => updateLayout('techText', s)}
              onDelete={() => updateLayout('techText', { deleted: true })}
              className="opacity-70 leading-relaxed"
            />
          )}
          {!layout.techImg?.deleted && layout.techImg && (
            <EditableImage
              layout={layout.techImg}
              isEditMode={isEditMode}
              onChange={(l: any) => updateLayout('techImg', l)}
              onDelete={() => updateLayout('techImg', { deleted: true })}
              className="rounded-3xl overflow-hidden bg-gray-100 shadow-sm"
            />
          )}
        </section>
      </article>
    </motion.div>
  );
}

function EditableImage({ layout, isEditMode, onChange, onDelete, className, onClick }: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange({ src: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const imageContent = (
    <div 
      className={cn("w-full h-full", className, !isEditMode && onClick && "cursor-pointer")}
      onClick={!isEditMode ? onClick : undefined}
    >
      {layout.src && <img src={layout.src} className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
    </div>
  );

  if (!isEditMode) {
    return (
      <div 
        style={{ 
          position: 'absolute', 
          left: layout.x || 0, 
          top: layout.y || 0, 
          width: layout.width, 
          height: layout.height 
        }}
      >
        {imageContent}
      </div>
    );
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <Rnd
        size={{ width: layout.width, height: layout.height }}
        position={{ x: layout.x || 0, y: layout.y || 0 }}
        onDragStop={(e, d) => onChange({ x: d.x, y: d.y })}
        onResizeStop={(e, direction, ref, delta, position) => {
          onChange({
            width: ref.offsetWidth,
            height: ref.offsetHeight,
            ...position,
          });
        }}
        enableResizing={{
          top: true, right: true, bottom: true, left: true,
          topRight: true, bottomRight: true, bottomLeft: true, topLeft: true
        }}
        className={cn("z-50 group", className)}
        dragHandleClassName="drag-handle"
      >
        <div className="w-full h-full relative border-2 border-transparent group-hover:border-black/20 transition-colors">
          {layout.src && <img src={layout.src} className="w-full h-full object-cover pointer-events-none" referrerPolicy="no-referrer" />}
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-white/90 p-2 rounded-lg shadow-sm hover:bg-white"
            >
              <Upload size={16} />
            </button>
            <div className="drag-handle bg-white/90 p-2 rounded-lg cursor-move shadow-sm hover:bg-white">
              <Move size={16} />
            </div>
            {onDelete && (
              <button 
                onClick={onDelete}
                className="bg-red-50 text-red-500 p-2 rounded-lg shadow-sm hover:bg-red-100"
              >
                X
              </button>
            )}
          </div>
        </div>
      </Rnd>
    </>
  );
}

function EditableText({ layout, isEditMode, fonts, onChange, onDelete, className, color: propColor }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsEditing(false);
      }
    };
    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing]);

  const fontSize = layout.fontSize || 16;
  const fontWeight = layout.fontWeight || 400;
  const fontFamily = layout.fontFamily || 'Inter';
  const lineHeight = layout.lineHeight || 1.5;
  const color = propColor || layout.color || '#E2E2E2';

  if (!isEditMode) {
    return (
      <div 
        style={{ 
          position: 'absolute', 
          left: layout.x || 0, 
          top: layout.y || 0, 
          width: layout.width 
        }}
        className="z-10"
      >
        <div
          style={{
            fontSize: `${fontSize}px`,
            fontWeight: fontWeight,
            fontFamily: fontFamily,
            lineHeight: lineHeight,
            whiteSpace: 'pre-wrap',
            color: color
          }}
          className={className}
        >
          {layout.value}
        </div>
      </div>
    );
  }

  return (
    <Rnd
      size={{ width: layout.width, height: 'auto' }}
      position={{ x: layout.x || 0, y: layout.y || 0 }}
      onDragStop={(e, d) => onChange({ x: d.x, y: d.y })}
      onResizeStop={(e, direction, ref, delta, position) => {
        onChange({
          width: ref.offsetWidth,
          ...position,
        });
      }}
      enableResizing={{ 
        top: true, right: true, bottom: true, left: true,
        topRight: true, bottomRight: true, bottomLeft: true, topLeft: true 
      }}
      disableDragging={isEditing}
      className="z-50 group"
    >
      <div ref={containerRef} className="relative">
        {isEditing ? (
          <div className="relative">
            <textarea
              autoFocus
              value={layout.value}
              onChange={(e) => onChange({ value: e.target.value })}
              className={cn(
                className,
                "w-full bg-white/10 backdrop-blur-md border-2 border-white/20 rounded p-2 outline-none resize-none shadow-xl z-[120]"
              )}
              style={{
                fontSize: `${fontSize}px`,
                fontWeight: fontWeight,
                fontFamily: fontFamily,
                lineHeight: lineHeight,
                minHeight: '1em',
                color: color
              }}
            />
            <div className="absolute top-full left-0 mt-2 p-4 bg-white shadow-2xl rounded-2xl z-[130] flex flex-col gap-4 min-w-[260px] border border-gray-100">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">Font Size</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onChange({ fontSize: Math.max(8, fontSize - 2) })}
                      className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200"
                    >-</button>
                    <span className="w-8 text-center font-mono text-sm">{fontSize}</span>
                    <button 
                      onClick={() => onChange({ fontSize: fontSize + 2 })}
                      className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200"
                    >+</button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">Weight</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onChange({ fontWeight: Math.max(100, fontWeight - 100) })}
                      className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200"
                    >-</button>
                    <span className="w-8 text-center font-mono text-sm">{fontWeight}</span>
                    <button 
                      onClick={() => onChange({ fontWeight: Math.min(900, fontWeight + 100) })}
                      className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200"
                    >+</button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">Line Height</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onChange({ lineHeight: Math.max(0.5, Math.round((lineHeight - 0.1) * 10) / 10) })}
                      className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200"
                    >-</button>
                    <span className="w-8 text-center font-mono text-sm">{lineHeight.toFixed(1)}</span>
                    <button 
                      onClick={() => onChange({ lineHeight: Math.round((lineHeight + 0.1) * 10) / 10 })}
                      className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200"
                    >+</button>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">Typeface</span>
                <div className="grid grid-cols-2 gap-2">
                  {fonts?.map((f: string) => (
                    <button
                      key={f}
                      onClick={() => onChange({ fontFamily: f })}
                      className={cn(
                        "px-3 py-2 text-[11px] rounded-lg text-left transition-all",
                        fontFamily === f ? "bg-black text-white" : "bg-gray-50 hover:bg-gray-100"
                      )}
                      style={{ fontFamily: f }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 bg-black text-white rounded-xl text-[10px] uppercase font-bold tracking-widest hover:bg-gray-800"
                >
                  Done
                </button>
                {onDelete && (
                  <button 
                    onClick={() => { onDelete(); setIsEditing(false); }}
                    className="px-4 py-2 bg-red-50 text-red-500 rounded-xl text-[10px] uppercase font-bold tracking-widest hover:bg-red-100"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => setIsEditing(true)}
            style={{
              fontSize: `${fontSize}px`,
              fontWeight: fontWeight,
              fontFamily: fontFamily,
              lineHeight: lineHeight,
              whiteSpace: 'pre-wrap',
              color: color
            }}
            className={cn(className, "cursor-pointer hover:bg-black/5 rounded px-2 -mx-2 transition-colors min-h-[1.5em]")}
          >
            {layout.value || "Click to edit"}
          </div>
        )}
      </div>
    </Rnd>
  );
}

function ProfileEditor({ profile, onSave, isAdmin }: { profile: { name: string, intro: string, introWidth?: number, introLineHeight?: number }, onSave: (p: any) => void, isAdmin: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [intro, setIntro] = useState(profile.intro);
  const [width, setWidth] = useState(profile.introWidth || 250);
  const [lineHeight, setLineHeight] = useState(profile.introLineHeight || 1.6);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setName(profile.name);
    setIntro(profile.intro);
    setWidth(profile.introWidth || 250);
    setLineHeight(profile.introLineHeight || 1.6);
  }, [profile]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isEditing) {
          onSave({ ...profile, name, intro, introWidth: width, introLineHeight: lineHeight });
          setIsEditing(false);
        }
      }
    };
    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, name, intro, width, lineHeight, onSave, profile]);

  const hasKorean = (text: string) => /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);
  const fontSize = hasKorean(intro) ? '15px' : '17px';

  if (isEditing && isAdmin) {
    return (
      <div ref={containerRef} className="flex flex-col gap-3 bg-white/90 backdrop-blur-md p-5 rounded-xl shadow-2xl border border-gray-100 min-w-[300px] z-[100]">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="font-medium tracking-tighter bg-transparent border-b border-gray-200 focus:border-black outline-none py-1"
            style={{ fontFamily: 'system-ui', fontSize: '22px' }}
            placeholder="Your Name"
            autoFocus
          />
        </div>
        
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Introduction</label>
          <textarea
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            className="text-gray-600 bg-transparent border-b border-gray-200 focus:border-black outline-none resize-none py-1"
            style={{ 
              fontFamily: 'Inter', 
              fontSize: fontSize,
              lineHeight: lineHeight,
              width: '100%'
            }}
            placeholder="Short Introduction"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Width: {width}px</label>
            <input 
              type="range" min="150" max="600" step="10"
              value={width} 
              onChange={(e) => setWidth(parseInt(e.target.value))}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Line Height: {lineHeight}</label>
            <input 
              type="range" min="1.0" max="3.0" step="0.1"
              value={lineHeight} 
              onChange={(e) => setLineHeight(parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
            />
          </div>
        </div>

        <span className="text-[10px] text-gray-400 mt-2 text-center italic">Click outside to save</span>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "flex flex-col gap-1 transition-opacity",
        isAdmin ? "cursor-pointer hover:opacity-70" : ""
      )}
      onDoubleClick={() => isAdmin && setIsEditing(true)}
    >
      <h2 
        className="font-medium tracking-tighter"
        style={{ fontFamily: 'system-ui', fontSize: '22px' }}
      >
        {profile.name}
      </h2>
      <p 
        className="text-gray-600 leading-relaxed whitespace-pre-wrap"
        style={{ 
          fontSize: fontSize,
          width: `${width}px`,
          lineHeight: lineHeight
        }}
      >
        {profile.intro}
      </p>
    </div>
  );
}
