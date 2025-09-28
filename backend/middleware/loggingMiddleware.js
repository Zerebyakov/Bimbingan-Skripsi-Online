import LogAktivitas from "../models/LogAktivitas.js";


// Middleware untuk logging aktivitas
export const logActivity = (activityType, description) => {
    return async (req, res, next) => {
        const originalSend = res.send;

        res.send = function (data) {
            // Log hanya jika request berhasil
            if (res.statusCode >= 200 && res.statusCode < 300) {
                LogAktivitas.create({
                    id_user: req.session.userId,
                    id_pengajuan: req.params.id_pengajuan || null,
                    type: activityType,
                    description: typeof description === 'function'
                        ? description(req)
                        : description
                }).catch(err => {
                    console.error('Logging error:', err);
                });
            }

            originalSend.call(this, data);
        };

        next();
    };
};
