import React, { useState, useRef, useEffect } from 'react';
import { Upload, Plus, Rotate3D, Trash2, Grid3x3, Settings, FolderOpen, PlusCircle, X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import './App.css'

const DEFAULT_FURNITURE = [
  { name: 'Single Bed', width: 1.0, depth: 2.0 },
  { name: 'Double Bed', width: 1.4, depth: 2.0 },
  { name: 'Sofa 2-Seater', width: 1.8, depth: 0.9 },
  { name: 'Sofa 3-Seater', width: 2.2, depth: 0.9 },
  { name: 'Dining Table 4p', width: 1.2, depth: 0.8 },
  { name: 'Dining Table 6p', width: 1.8, depth: 0.9 },
  { name: 'Dining Chair', width: 0.5, depth: 0.5 },
  { name: 'Desk Chair', width: 0.6, depth: 0.6 },
  { name: 'Coffee Table', width: 1.2, depth: 0.6 },
  { name: 'Sq Coffee Table', width: 0.9, depth: 0.9 },
  { name: 'Desk', width: 1.4, depth: 0.7 },
  { name: 'Armchair', width: 0.9, depth: 0.9 },
  { name: 'Wardrobe', width: 1.2, depth: 0.6 },
  { name: 'Chest of Drawers', width: 0.9, depth: 0.5 },
  { name: 'Bedside Cabinet', width: 0.5, depth: 0.4 },
  { name: 'Thin Shelf', width: 1.0, depth: 0.25 },
  { name: 'Shelf', width: 1.0, depth: 0.4 },
  { name: 'Bookshelf', width: 0.8, depth: 0.3 },
  { name: 'TV Stand', width: 1.5, depth: 0.4 },
];

export default function FloorPlanDesigner() {
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [floorPlan, setFloorPlan] = useState(null);
  const [floorPlanDimensions, setFloorPlanDimensions] = useState({ width: 1200, height: 800 });
  const [gridSize, setGridSize] = useState(50);
  const [metersPerSquare, setMetersPerSquare] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [gridOffsetX, setGridOffsetX] = useState(0);
  const [gridOffsetY, setGridOffsetY] = useState(0);
  const [furniture, setFurniture] = useState(DEFAULT_FURNITURE);
  const [placedItems, setPlacedItems] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDraggingItem, setIsDraggingItem] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [customForm, setCustomForm] = useState({ name: '', width: '', depth: '', image: '', rotation: 0 });
  const [activeTab, setActiveTab] = useState('projects');
  const [newProjectName, setNewProjectName] = useState('');
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const canvasContainerRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const savedProjects = localStorage.getItem('floorPlanProjects');
    const savedFurniture = localStorage.getItem('customFurniture');
    
    if (savedProjects) {
      const parsedProjects = JSON.parse(savedProjects);
      setProjects(parsedProjects);
      if (parsedProjects.length > 0) {
        loadProject(parsedProjects[0].id, parsedProjects);
      }
    }
    
    if (savedFurniture) {
      const customFurniture = JSON.parse(savedFurniture);
      setFurniture([...DEFAULT_FURNITURE, ...customFurniture]);
    }
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('floorPlanProjects', JSON.stringify(projects));
    }
  }, [projects]);

  useEffect(() => {
    if (currentProjectId) {
      saveCurrentProject();
    }
  }, [placedItems, gridSize, metersPerSquare, showGrid, gridOffsetX, gridOffsetY, floorPlanDimensions]);

  useEffect(() => {
    drawCanvas();
  }, [floorPlan, gridSize, showGrid, placedItems, selectedItem, floorPlanDimensions, gridOffsetX, gridOffsetY]);

  const saveCurrentProject = () => {
    if (!currentProjectId) return;

    setProjects(prev => prev.map(p => {
      if (p.id === currentProjectId) {
        return {
          ...p,
          placedItems,
          gridSize,
          metersPerSquare,
          showGrid,
          gridOffsetX,
          gridOffsetY,
          floorPlanDimensions,
          lastModified: new Date().toISOString()
        };
      }
      return p;
    }));
  };

  const createNewProject = () => {
    if (!newProjectName.trim()) {
      alert('Please enter a project name');
      return;
    }

    const newProject = {
      id: Date.now().toString(),
      name: newProjectName,
      floorPlanImage: null,
      placedItems: [],
      gridSize: 50,
      metersPerSquare: 1,
      showGrid: true,
      gridOffsetX: 0,
      gridOffsetY: 0,
      floorPlanDimensions: { width: 1200, height: 800 },
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    setProjects([...projects, newProject]);
    setCurrentProjectId(newProject.id);
    setNewProjectName('');
    
    setFloorPlan(null);
    setPlacedItems([]);
    setGridSize(50);
    setMetersPerSquare(1);
    setShowGrid(true);
    setGridOffsetX(0);
    setGridOffsetY(0);
    setFloorPlanDimensions({ width: 1200, height: 800 });
    setSelectedItem(null);
  };

  const loadProject = (projectId, projectsList = projects) => {
    const project = projectsList.find(p => p.id === projectId);
    if (!project) return;

    setCurrentProjectId(projectId);
    setPlacedItems(project.placedItems || []);
    setGridSize(project.gridSize || 50);
    setMetersPerSquare(project.metersPerSquare || 1);
    setShowGrid(project.showGrid !== undefined ? project.showGrid : true);
    setGridOffsetX(project.gridOffsetX || 0);
    setGridOffsetY(project.gridOffsetY || 0);
    setFloorPlanDimensions(project.floorPlanDimensions || { width: 1200, height: 800 });
    setSelectedItem(null);

    if (project.floorPlanImage) {
      const img = new Image();
      img.onload = () => {
        setFloorPlan(img);
      };
      img.src = project.floorPlanImage;
    } else {
      setFloorPlan(null);
    }
  };

  const deleteProject = (e, projectId) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project?')) return;

    const updatedProjects = projects.filter(p => p.id !== projectId);
    setProjects(updatedProjects);

    if (currentProjectId === projectId) {
      if (updatedProjects.length > 0) {
        loadProject(updatedProjects[0].id, updatedProjects);
      } else {
        setCurrentProjectId(null);
        setFloorPlan(null);
        setPlacedItems([]);
      }
    }

    if (updatedProjects.length === 0) {
      localStorage.removeItem('floorPlanProjects');
    } else {
      localStorage.setItem('floorPlanProjects', JSON.stringify(updatedProjects));
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxWidth = window.innerWidth * 0.6;
          const maxHeight = window.innerHeight - 100;
          
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
          
          const newDimensions = { width: Math.round(width), height: Math.round(height) };
          setFloorPlanDimensions(newDimensions);
          setFloorPlan(img);

          if (currentProjectId) {
            setProjects(prev => prev.map(p => {
              if (p.id === currentProjectId) {
                return {
                  ...p,
                  floorPlanImage: event.target.result,
                  floorPlanDimensions: newDimensions,
                  lastModified: new Date().toISOString()
                };
              }
              return p;
            }));
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (floorPlan) {
      ctx.drawImage(floorPlan, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#adb5bd';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Upload a floor plan to get started', canvas.width / 2, canvas.height / 2);
    }

    if (showGrid && gridSize > 0) {
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      for (let x = gridOffsetX; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let x = gridOffsetX - gridSize; x >= 0; x -= gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = gridOffsetY; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      for (let y = gridOffsetY - gridSize; y >= 0; y -= gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    placedItems.forEach((item, idx) => {
      const pixelsPerMeter = gridSize / metersPerSquare;
      const widthPx = item.width * pixelsPerMeter;
      const depthPx = item.depth * pixelsPerMeter;

      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate((item.rotation || 0) * Math.PI / 180);

      if (item.image && item.imageObj && item.imageObj.complete && item.imageObj.naturalWidth > 0) {
        ctx.drawImage(item.imageObj, -widthPx/2, -depthPx/2, widthPx, depthPx);
      } else {
        ctx.fillStyle = 'rgba(100, 150, 200, 0.3)';
        ctx.fillRect(-widthPx/2, -depthPx/2, widthPx, depthPx);
        ctx.strokeStyle = 'rgba(70, 120, 170, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(-widthPx/2, -depthPx/2, widthPx, depthPx);
        
        ctx.fillStyle = '#334155';
        ctx.font = `${Math.min(widthPx, depthPx) / 5}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.name, 0, 0);
      }

      if (selectedItem === idx) {
        ctx.strokeStyle = '#4A90E2';
        ctx.lineWidth = 3;
        ctx.strokeRect(-widthPx/2, -depthPx/2, widthPx, depthPx);
      }

      ctx.restore();
    });
  };

  const drawFurniturePreview = (item) => {
    const canvas = document.createElement('canvas');
    const size = 100;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    const scale = 0.8;
    const w = size * scale * (item.width / Math.max(item.width, item.depth));
    const h = size * scale * (item.depth / Math.max(item.width, item.depth));
    
    ctx.fillStyle = 'rgba(100, 150, 200, 0.3)';
    ctx.fillRect((size - w) / 2, (size - h) / 2, w, h);
    ctx.strokeStyle = 'rgba(70, 120, 170, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect((size - w) / 2, (size - h) / 2, w, h);
    
    ctx.fillStyle = '#334155';
    ctx.font = `${Math.min(w, h) / 4}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.name, size / 2, size / 2);
    
    return canvas.toDataURL();
  };

  const getItemAtPosition = (x, y) => {
    const pixelsPerMeter = gridSize / metersPerSquare;

    for (let i = placedItems.length - 1; i >= 0; i--) {
      const item = placedItems[i];
      const widthPx = item.width * pixelsPerMeter;
      const depthPx = item.depth * pixelsPerMeter;
      
      const dx = x - item.x;
      const dy = y - item.y;
      const angle = -(item.rotation || 0) * Math.PI / 180;
      const rotX = dx * Math.cos(angle) - dy * Math.sin(angle);
      const rotY = dx * Math.sin(angle) + dy * Math.cos(angle);

      if (Math.abs(rotX) <= widthPx/2 && Math.abs(rotY) <= depthPx/2) {
        return i;
      }
    }
    return null;
  };

  const handleCanvasClick = (e) => {
    if (isDraggingItem || isPanning) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoom;
    const y = (e.clientY - rect.top - panOffset.y) / zoom;

    const itemIndex = getItemAtPosition(x, y);
    setSelectedItem(itemIndex);
  };

  const handleCanvasMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoom;
    const y = (e.clientY - rect.top - panOffset.y) / zoom;

    if (isSpacePressed) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    const itemIndex = getItemAtPosition(x, y);
    
    if (itemIndex !== null) {
      const item = placedItems[itemIndex];
      const dx = x - item.x;
      const dy = y - item.y;
      
      setSelectedItem(itemIndex);
      setIsDraggingItem(true);
      setDragOffset({ x: dx, y: dy });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    if (!isDraggingItem || selectedItem === null) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoom;
    const y = (e.clientY - rect.top - panOffset.y) / zoom;

    const updated = [...placedItems];
    updated[selectedItem].x = x - dragOffset.x;
    updated[selectedItem].y = y - dragOffset.y;
    setPlacedItems(updated);
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingItem(false);
    setIsPanning(false);
  };

  const handleDragStart = (furnitureItem) => {
    setDraggedItem(furnitureItem);
  };

  const handleCanvasDrop = (e) => {
    e.preventDefault();
    if (!draggedItem) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoom;
    const y = (e.clientY - rect.top - panOffset.y) / zoom;

    const newItem = {
      ...draggedItem,
      x,
      y,
      rotation: 0
    };

    if (draggedItem.image) {
      const img = new Image();
      img.onload = () => {
        newItem.imageObj = img;
        const newItems = [...placedItems, newItem];
        setPlacedItems(newItems);
        setSelectedItem(newItems.length - 1);
      };
      img.onerror = () => {
        newItem.imageObj = null;
        const newItems = [...placedItems, newItem];
        setPlacedItems(newItems);
        setSelectedItem(newItems.length - 1);
      };
      img.src = draggedItem.image;
    } else {
      const newItems = [...placedItems, newItem];
      setPlacedItems(newItems);
      setSelectedItem(newItems.length - 1);
    }
    
    setDraggedItem(null);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, zoom * delta));
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const beforeX = (mouseX - panOffset.x) / zoom;
    const beforeY = (mouseY - panOffset.y) / zoom;
    
    const afterX = (mouseX - panOffset.x) / newZoom;
    const afterY = (mouseY - panOffset.y) / newZoom;
    
    setPanOffset({
      x: panOffset.x + (afterX - beforeX) * newZoom,
      y: panOffset.y + (afterY - beforeY) * newZoom
    });
    
    setZoom(newZoom);
  };

  const zoomIn = () => {
    setZoom(prev => Math.min(5, prev * 1.2));
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(0.1, prev / 1.2));
  };

  const resetView = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const rotateSelected = () => {
    if (selectedItem !== null) {
      const updated = [...placedItems];
      updated[selectedItem].rotation = (updated[selectedItem].rotation || 0) + 45;
      setPlacedItems(updated);
    }
  };

  const deleteSelected = () => {
    if (selectedItem !== null) {
      setPlacedItems(placedItems.filter((_, idx) => idx !== selectedItem));
      setSelectedItem(null);
    }
  };

  const addCustomFurniture = () => {
    if (!customForm.name || !customForm.width || !customForm.depth) {
      alert('Please fill name, width, and depth fields');
      return;
    }

    const addFurnitureItem = (newFurniture) => {
      const customFurnitureList = furniture.slice(DEFAULT_FURNITURE.length);
      const updatedCustomFurniture = [...customFurnitureList, newFurniture];
      
      setFurniture([...DEFAULT_FURNITURE, ...updatedCustomFurniture]);
      localStorage.setItem('customFurniture', JSON.stringify(updatedCustomFurniture));
      setCustomForm({ name: '', width: '', depth: '', image: '', rotation: 0 });
    };

    if (customForm.image) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        
        ctx.save();
        ctx.translate(size/2, size/2);
        ctx.rotate(customForm.rotation * Math.PI / 180);
        
        const scale = Math.min(size / img.width, size / img.height) * 0.9;
        const w = img.width * scale;
        const h = img.height * scale;
        
        ctx.drawImage(img, -w/2, -h/2, w, h);
        ctx.restore();
        
        const rotatedImage = canvas.toDataURL();

        const newFurniture = {
          name: customForm.name,
          width: parseFloat(customForm.width),
          depth: parseFloat(customForm.depth),
          image: rotatedImage
        };

        addFurnitureItem(newFurniture);
      };
      img.onerror = () => {
        alert('Failed to load image. Adding furniture without image.');
        const newFurniture = {
          name: customForm.name,
          width: parseFloat(customForm.width),
          depth: parseFloat(customForm.depth)
        };
        addFurnitureItem(newFurniture);
      };
      img.src = customForm.image;
    } else {
      const newFurniture = {
        name: customForm.name,
        width: parseFloat(customForm.width),
        depth: parseFloat(customForm.depth)
      };
      addFurnitureItem(newFurniture);
    }
  };

  const deleteCustomFurniture = (index) => {
    if (!confirm('Delete this custom furniture item?')) return;
    
    const customIndex = index - DEFAULT_FURNITURE.length;
    const customFurnitureList = furniture.slice(DEFAULT_FURNITURE.length);
    customFurnitureList.splice(customIndex, 1);
    
    setFurniture([...DEFAULT_FURNITURE, ...customFurnitureList]);
    localStorage.setItem('customFurniture', JSON.stringify(customFurnitureList));
  };

  const rotateCustomImage = () => {
    setCustomForm({...customForm, rotation: (customForm.rotation + 45) % 360});
  };

  const getSelectedItemPosition = () => {
    if (selectedItem === null || !canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const item = placedItems[selectedItem];
    
    return {
      x: rect.left + item.x * zoom + panOffset.x,
      y: rect.top + item.y * zoom + panOffset.y
    };
  };

  const currentProject = projects.find(p => p.id === currentProjectId);

  const tabs = [
    { id: 'projects', label: 'Projects', icon: FolderOpen },
    { id: 'grid', label: 'Grid', icon: Grid3x3 },
    { id: 'furniture', label: 'Furniture', icon: Settings },
    { id: 'custom', label: 'Custom', icon: Plus },
    { id: 'view', label: 'View', icon: Maximize2 },
  ];

  const selectedPos = getSelectedItemPosition();

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex overflow-hidden">
      <div className="w-full max-w-sm lg:max-w-md xl:max-w-lg bg-white shadow-lg flex flex-col flex-shrink-0">
        <div className="p-4 lg:p-6 border-b flex-shrink-0">
          <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Floor Plan Designer</h1>
          {currentProject && (
            <p className="text-sm text-gray-600 mt-1 truncate">{currentProject.name}</p>
          )}
        </div>

        <div className="flex border-b flex-shrink-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 lg:py-3 text-xs font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {activeTab === 'projects' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Projects</h2>
              
              <div className="mb-6 border-2 border-dashed border-gray-300 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3">Create New Project</h3>
                <input
                  type="text"
                  placeholder="Project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 mb-2"
                  onKeyPress={(e) => e.key === 'Enter' && createNewProject()}
                />
                <button
                  onClick={createNewProject}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition font-medium flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  Create Project
                </button>
              </div>

              {currentProject && (
                <div className="mb-6 border rounded-lg p-4 bg-blue-50">
                  <h3 className="text-sm font-medium mb-3">Upload Floor Plan</h3>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="w-full bg-white hover:bg-gray-50 border-2 border-blue-300 text-blue-700 py-2 px-4 rounded-lg transition font-medium flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {floorPlan ? 'Change Floor Plan' : 'Upload Floor Plan'}
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {projects.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No projects yet. Create one to get started!</p>
                )}
                {projects.map(project => (
                  <div
                    key={project.id}
                    className={`border-2 rounded-lg p-3 cursor-pointer transition ${
                      currentProjectId === project.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 bg-white'
                    }`}
                    onClick={() => loadProject(project.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{project.name}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(project.lastModified).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteProject(e, project.id)}
                        className="ml-2 text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'grid' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Grid Configuration</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Grid Size (pixels)</label>
                  <input
                    type="number"
                    value={gridSize}
                    onChange={(e) => setGridSize(Number(e.target.value))}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Size of each grid square</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Meters per Square</label>
                  <input
                    type="number"
                    step="0.1"
                    value={metersPerSquare}
                    onChange={(e) => setMetersPerSquare(Number(e.target.value))}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Real-world size of each square</p>
                </div>
                <div>
                  <label className="flex items-center gap-2 border rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={showGrid}
                      onChange={(e) => setShowGrid(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-medium">Show Grid Overlay</span>
                  </label>
                </div>
              </div>

              <div className="border-t pt-6 mt-6">
                <h3 className="text-base font-semibold mb-3">Grid Alignment</h3>
                <p className="text-sm text-gray-600 mb-4">Adjust the grid position to align with your floor plan</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Horizontal Offset (X)</label>
                    <input
                      type="range"
                      min="0"
                      max={gridSize}
                      value={gridOffsetX}
                      onChange={(e) => setGridOffsetX(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0px</span>
                      <span className="font-medium">{gridOffsetX}px</span>
                      <span>{gridSize}px</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Vertical Offset (Y)</label>
                    <input
                      type="range"
                      min="0"
                      max={gridSize}
                      value={gridOffsetY}
                      onChange={(e) => setGridOffsetY(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0px</span>
                      <span className="font-medium">{gridOffsetY}px</span>
                      <span>{gridSize}px</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setGridOffsetX(0);
                    setGridOffsetY(0);
                  }}
                  className="mt-4 w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg transition"
                >
                  Reset Alignment
                </button>
              </div>
            </div>
          )}

          {activeTab === 'furniture' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Furniture Library</h2>
              <p className="text-sm text-gray-600 mb-4">Drag and drop furniture onto the floor plan</p>
              <div className="space-y-2">
                {furniture.map((item, idx) => (
                  <div
                    key={idx}
                    draggable
                    onDragStart={() => handleDragStart(item)}
                    className="border-2 border-gray-200 rounded-lg p-3 cursor-move hover:border-blue-400 hover:shadow-md transition bg-white relative group"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={item.image || drawFurniturePreview(item)} 
                        alt={item.name} 
                        className="w-16 h-16 object-contain flex-shrink-0" 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{item.name}</div>
                        <div className="text-xs text-gray-500">
                          {item.width}m × {item.depth}m
                        </div>
                      </div>
                      {idx >= DEFAULT_FURNITURE.length && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            deleteCustomFurniture(idx);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'custom' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Add Custom Furniture</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Sectional Sofa"
                    value={customForm.name}
                    onChange={(e) => setCustomForm({...customForm, name: e.target.value})}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Width (meters)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g., 2.5"
                    value={customForm.width}
                    onChange={(e) => setCustomForm({...customForm, width: e.target.value})}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Depth (meters)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g., 1.2"
                    value={customForm.depth}
                    onChange={(e) => setCustomForm({...customForm, depth: e.target.value})}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Image URL (optional)</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={customForm.image}
                    onChange={(e) => setCustomForm({...customForm, image: e.target.value})}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>
                
                {customForm.image && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="text-sm font-medium mb-3">Preview</div>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 border rounded flex items-center justify-center bg-white">
                        <img
                          src={customForm.image}
                          alt="Preview"
                          className="max-w-full max-h-full object-contain"
                          style={{transform: `rotate(${customForm.rotation}deg)`}}
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      </div>
                      <button
                        onClick={rotateCustomImage}
                        className="bg-gray-200 hover:bg-gray-300 p-3 rounded-lg transition flex items-center gap-2"
                      >
                        <Rotate3D className="w-5 h-5" />
                        Rotate 45°
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={addCustomFurniture}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg transition font-medium"
                >
                  Add to Furniture Library
                </button>
              </div>
            </div>
          )}

          {activeTab === 'view' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">View Controls</h2>
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="text-sm font-medium mb-3">Current Zoom</div>
                  <div className="text-3xl font-bold text-blue-600 text-center mb-4">
                    {Math.round(zoom * 100)}%
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={zoomIn}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition font-medium flex items-center justify-center gap-2"
                    >
                      <ZoomIn className="w-5 h-5" />
                      Zoom In
                    </button>
                    <button
                      onClick={zoomOut}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition font-medium flex items-center justify-center gap-2"
                    >
                      <ZoomOut className="w-5 h-5" />
                      Zoom Out
                    </button>
                    <button
                      onClick={resetView}
                      className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition font-medium flex items-center justify-center gap-2"
                    >
                      <Maximize2 className="w-5 h-5" />
                      Reset View
                    </button>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-blue-50">
                  <div className="text-sm font-semibold mb-2 text-blue-900">Navigation Tips</div>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="font-semibold min-w-fit">Mouse Wheel:</span>
                      <span>Zoom in/out</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold min-w-fit">Space + Drag:</span>
                      <span>Pan around the floor plan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold min-w-fit">Click + Drag:</span>
                      <span>Move furniture items</span>
                    </li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="text-sm font-medium mb-3">Zoom Range</div>
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>10%</span>
                    <span>500%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-hidden relative">
          {!currentProject ? (
            <div className="text-center">
              <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Project Selected</h3>
              <p className="text-gray-500">Create or select a project to get started</p>
            </div>
          ) : (
            <div 
              ref={canvasContainerRef}
              className="relative overflow-hidden"
              style={{ 
                cursor: isSpacePressed ? 'grab' : isPanning ? 'grabbing' : 'default'
              }}
            >
              <div
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                  transformOrigin: '0 0',
                }}
              >
                <canvas
                  ref={canvasRef}
                  width={floorPlanDimensions.width}
                  height={floorPlanDimensions.height}
                  className="border-2 border-gray-300 rounded-lg shadow-lg bg-white"
                  onClick={handleCanvasClick}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  onDrop={handleCanvasDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onWheel={handleWheel}
                  style={{ cursor: isDraggingItem ? 'grabbing' : 'pointer' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedItem !== null && selectedPos && (
        <div
          className="fixed bg-white rounded-lg shadow-2xl p-2 flex gap-2 z-50 border-2 border-blue-500"
          style={{
            left: `${selectedPos.x + 20}px`,
            top: `${selectedPos.y - 50}px`,
          }}
        >
          <button
            onClick={rotateSelected}
            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition"
            title="Rotate"
          >
            <Rotate3D className="w-5 h-5" />
          </button>
          <button
            onClick={deleteSelected}
            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition"
            title="Delete"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setSelectedItem(null)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-lg transition"
            title="Deselect"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}