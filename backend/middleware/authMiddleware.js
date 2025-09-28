// Middleware untuk validasi session dan autentikasi
export const verifySession = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized - Session not found"
        });
    }
    next();
};

// Middleware untuk validasi role
export const verifyRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.session.role) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized - Role not found"
            });
        }

        if (!allowedRoles.includes(req.session.role)) {
            return res.status(403).json({
                success: false,
                message: "Forbidden - Insufficient permissions"
            });
        }

        next();
    };
};

export const verifyAdmin = verifyRole(['admin']);
export const verifyDosen = verifyRole(['dosen']);
export const verifyMahasiswa = verifyRole(['mahasiswa']);
export const verifyAdminOrDosen = verifyRole(['admin', 'dosen']);
export const verifyDosenOrMahasiswa = verifyRole(['dosen', 'mahasiswa']);
export const verifyAllRoles = verifyRole(['admin', 'dosen', 'mahasiswa']);
