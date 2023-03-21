var Mathp = {
    gaussianElimination(system, pivot) {
        var row = 0, col = 0, b = pivot.length - 1, _col,
            c, j, i, solution = new Array(pivot.length)
        for (i = 0; i < (system.length - 1) * (system.length / 2); i++) {
            _col = pivot.length - col - 1, c = -system[row][_col] / system[row + 1][_col]
            if (!isNaN(c)) {
                for (j = 0; j < pivot.length - col; j++) system[row][j] += system[row + 1][j] * c
                pivot[row] += pivot[row + 1] * c
            }
            row++
            if (row >= b) row = 0, col += 1, b -= 1 
        }
        solution[0] = pivot[0] / system[0][0]
        for (i = 1; i < solution.length; i++) {
            c = 0
            for (j = 0; j < i; j++) c += solution[j] * system[i][j]
            solution[i] = (pivot[i] - c) / system[i][i]
        }
        return solution
    }
}

var exports = Mathp
