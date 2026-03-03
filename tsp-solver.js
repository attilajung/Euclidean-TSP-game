class TSPSolver {
    constructor(points) {
        this.points = points;
    }

    solve() {
        if (this.points.length < 2) return { distance: 0, path: [] };

        const attempts = 100; // Number of restarts
        let bestDist = Infinity;
        let bestPath = [];

        for (let i = 0; i < attempts; i++) {
            // Generate random initial path
            let currentPath = this.shuffle(this.range(this.points.length));
            let currentDist = this.calculateDistance(currentPath);

            // 2-Opt Optimization
            let improved = true;
            while (improved) {
                improved = false;
                for (let a = 0; a < currentPath.length - 1; a++) {
                    for (let b = a + 1; b < currentPath.length; b++) {
                        const newPath = this.twoOptSwap(currentPath, a, b);
                        const newDist = this.calculateDistance(newPath);
                        if (newDist < currentDist - 1e-9) { // epsilon for float comparison
                            currentPath = newPath;
                            currentDist = newDist;
                            improved = true;
                        }
                    }
                }
            }

            if (currentDist < bestDist) {
                bestDist = currentDist;
                bestPath = currentPath;
            }
        }

        return { distance: bestDist, path: bestPath };
    }

    range(n) {
        return Array.from({ length: n }, (_, i) => i);
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    twoOptSwap(path, i, j) {
        const newPath = path.slice(0, i);
        const reversedSegment = path.slice(i, j + 1).reverse();
        const tail = path.slice(j + 1);
        return newPath.concat(reversedSegment).concat(tail);
    }

    calculateDistance(path) {
        let dist = 0;
        for (let i = 0; i < path.length; i++) {
            const p1 = this.points[path[i]];
            const p2 = this.points[path[(i + 1) % path.length]];
            dist += this.dist(p1, p2);
        }
        return dist;
    }

    dist(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
