

export const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    if (err.name === 'SequelizeValidationError') {
        const errors = err.errors.map(error => ({
            field: error.path,
            message: error.message
        }));

        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors
        });
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
            success: false,
            message: 'Data sudah ada dalam sistem'
        });
    }

    if (err.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
            success: false,
            message: 'Data terkait tidak ditemukan'
        });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
};

// 404 handler
export const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
};
