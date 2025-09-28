import argon2 from 'argon2';
import User from '../models/User.js';
import KonfigurasiSistem from '../models/KonfigurasiSistem.js';
import dotenv from 'dotenv'

dotenv.config();


export const createDefaultAdmin = async () => {
    try {
        console.log('🌱 Creating default admin...');
        const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL;
        const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD;

        const adminExists = await User.findOne({
            where: { email: defaultEmail }
        });

        if (adminExists) {
            console.log('ℹ️  Default admin already exists');
            return;
        }

        const hashedPassword = await argon2.hash(defaultPassword);
        
        const admin = await User.create({
            email: defaultEmail,
            password: hashedPassword,
            role: 'admin',
            status: 'aktif'
        });

        console.log("✅ Default admin created successfully!");
        console.log(`📧 Email: ${defaultEmail}`);
        console.log(`🔑 Password: ${defaultPassword}`);
        
        return admin;
    } catch (error) {
        console.error('❌ Error creating default admin:', error);
        throw error;
    }
};

export const createSystemConfig = async () => {
    try {
        console.log('🌱 Creating system configuration...');
        
        const configExists = await KonfigurasiSistem.findOne();
        if (configExists) {
            console.log('ℹ️  System configuration already exists');
            return;
        }

        const config = await KonfigurasiSistem.create({
            tahunAkademikAktif: '2024/2025',
            semesterAktif: 'Ganjil',
            kuotaPerDosen: 10,
            formatNomorKartu: 'KB-',
            tanggalMulaiBimbingan: new Date('2024-09-01'),
            tanggalSelesaiBimbingan: new Date('2025-01-31')
        });

        console.log('✅ System configuration created successfully!');
        return config;
    } catch (error) {
        console.error('❌ Error creating system configuration:', error);
        throw error;
    }
};
