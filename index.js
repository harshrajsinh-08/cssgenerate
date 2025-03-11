class GridGenerator {
    constructor() {
        this.gridContainer = document.getElementById('gridContainer');
        this.cssOutput = document.getElementById('cssOutput');
        this.htmlOutput = document.getElementById('htmlOutput');
        this.itemCount = 0;
        this.draggedItem = null;
        this.dragOverItem = null;
        
        this.columnsInput = document.getElementById('columns');
        this.rowsInput = document.getElementById('rows');
        this.gapInput = document.getElementById('gap');
        
        document.getElementById('addItem').addEventListener('click', () => this.addItem());
        this.columnsInput.addEventListener('input', () => this.updateGrid());
        this.rowsInput.addEventListener('input', () => this.updateGrid());
        this.gapInput.addEventListener('input', () => this.updateGrid());
        
        document.getElementById('copyCss').addEventListener('click', () => this.copyToClipboard('css'));
        document.getElementById('copyHtml').addEventListener('click', () => this.copyToClipboard('html'));
        
        this.gridContainer.addEventListener('dragover', (e) => this.handleContainerDragOver(e));
        this.gridContainer.addEventListener('dragleave', (e) => this.handleContainerDragLeave(e));
        this.gridContainer.addEventListener('drop', (e) => this.handleContainerDrop(e));
        
        this.updateGrid();
    }

    updateGrid() {
        const columns = this.columnsInput.value;
        const rows = this.rowsInput.value;
        const gap = this.gapInput.value;
        
        this.gridContainer.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        this.gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        this.gridContainer.style.gap = `${gap}px`;
        
        this.updateCodeOutput();
    }

    addItem() {
        this.itemCount++;
        const item = document.createElement('div');
        item.className = 'grid-item';
        item.textContent = this.itemCount;
        
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        item.appendChild(resizeHandle);
        
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-button';
        removeButton.innerHTML = '×';
        removeButton.title = 'Remove item';
        removeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            item.remove();
            this.updateCodeOutput();
        });
        item.appendChild(removeButton);
        
        item.draggable = true;
        
        item.addEventListener('dragstart', (e) => this.handleDragStart(e));
        item.addEventListener('dragend', (e) => this.handleDragEnd(e));
        item.addEventListener('dragenter', (e) => this.handleDragEnter(e));
        item.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        item.addEventListener('dragover', (e) => this.handleDragOver(e));
        item.addEventListener('drop', (e) => this.handleDrop(e));
        
        let isResizing = false;
        let startX, startY, startWidth, startHeight;
        
        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = item.offsetWidth;
            startHeight = item.offsetHeight;
            
            const onMouseMove = (e) => {
                if (!isResizing) return;
                
                const width = startWidth + (e.clientX - startX);
                const height = startHeight + (e.clientY - startY);
                
                item.style.gridColumnEnd = `span ${Math.ceil(width / (this.gridContainer.offsetWidth / this.columnsInput.value))}`;
                item.style.gridRowEnd = `span ${Math.ceil(height / (this.gridContainer.offsetHeight / this.rowsInput.value))}`;
                
                this.updateCodeOutput();
            };
            
            const onMouseUp = () => {
                isResizing = false;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
        this.gridContainer.appendChild(item);
        this.updateCodeOutput();
    }

    handleDragStart(e) {
        this.draggedItem = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', '');

        const dragImage = e.target.cloneNode(true);
        dragImage.style.opacity = '0.6';
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, e.offsetX, e.offsetY);
        setTimeout(() => document.body.removeChild(dragImage), 0);
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggedItem = null;
        this.removeAllDragOverStyles();
    }

    handleDragEnter(e) {
        if (e.target.classList.contains('grid-item') && e.target !== this.draggedItem) {
            e.target.classList.add('drag-over');
            this.dragOverItem = e.target;
        }
    }

    handleDragLeave(e) {
        if (e.target.classList.contains('grid-item')) {
            e.target.classList.remove('drag-over');
            if (this.dragOverItem === e.target) {
                this.dragOverItem = null;
            }
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleContainerDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleContainerDragLeave(e) {
        if (e.target === this.gridContainer) {
            this.removeAllDragOverStyles();
        }
    }

    handleContainerDrop(e) {
        e.preventDefault();
        if (!this.draggedItem) return;
        
        const dropTarget = e.target.closest('.grid-item') || this.gridContainer;
        if (dropTarget === this.gridContainer) {
            this.gridContainer.insertBefore(this.draggedItem, document.getElementById('addItem'));
        }
        
        this.removeAllDragOverStyles();
        this.updateCodeOutput();
    }

    handleDrop(e) {
        e.preventDefault();
        if (!this.draggedItem || !this.dragOverItem) return;
        
        const items = Array.from(this.gridContainer.querySelectorAll('.grid-item'));
        const draggedIndex = items.indexOf(this.draggedItem);
        const dropIndex = items.indexOf(this.dragOverItem);
        
        if (draggedIndex > dropIndex) {
            this.dragOverItem.parentNode.insertBefore(this.draggedItem, this.dragOverItem);
        } else {
            this.dragOverItem.parentNode.insertBefore(this.draggedItem, this.dragOverItem.nextSibling);
        }
        
        this.removeAllDragOverStyles();
        this.updateCodeOutput();
    }

    removeAllDragOverStyles() {
        this.gridContainer.querySelectorAll('.grid-item').forEach(item => {
            item.classList.remove('drag-over');
        });
    }

    copyToClipboard(type) {
        const text = type === 'css' ? this.cssOutput.textContent : this.htmlOutput.textContent;
        navigator.clipboard.writeText(text).then(() => {
            const button = document.getElementById(`copy${type.charAt(0).toUpperCase() + type.slice(1)}`);
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        });
    }

    updateCodeOutput() {
        const cssCode = `.grid-container {
    display: grid;
    grid-template-columns: repeat(${this.columnsInput.value}, 1fr);
    grid-template-rows: repeat(${this.rowsInput.value}, 1fr);
    gap: ${this.gapInput.value}px;
    padding: 1rem;
}

.grid-item {
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
}`;
        let htmlCode = '<div class="grid-container">\n';
        const items = Array.from(this.gridContainer.querySelectorAll('.grid-item'));
        items.forEach((item, index) => {
            const colSpan = item.style.gridColumnEnd ? 
                `    style="grid-column: span ${item.style.gridColumnEnd.replace('span ', '')};"` : '';
            const rowSpan = item.style.gridRowEnd ?
                ` grid-row: span ${item.style.gridRowEnd.replace('span ', '')};` : '';
            htmlCode += `    <div class="grid-item"${colSpan}${rowSpan}>${index + 1}</div>\n`;
        });
        htmlCode += '</div>';
        this.cssOutput.textContent = cssCode;
        this.htmlOutput.textContent = htmlCode;
    }
}
document.addEventListener('DOMContentLoaded', () => {
    new GridGenerator();
});