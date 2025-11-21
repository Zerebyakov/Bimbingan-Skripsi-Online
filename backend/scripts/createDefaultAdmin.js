import argon2 from 'argon2';
import User from '../models/User.js';
import PeriodeSkripsi from '../models/PeriodeSkripsi.js';
import dotenv from 'dotenv';

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

export const createDefaultPeriode = async () => {
    try {
        console.log('🌱 Creating default periode skripsi...');

        // Cek apakah sudah ada periode aktif
        const periodeExists = await PeriodeSkripsi.findOne({
            where: { isActive: true }
        });

        if (periodeExists) {
            console.log('ℹ️  Active periode skripsi already exists');
            console.log(`📅 Periode: ${periodeExists.tahun_akademik} - ${periodeExists.semester}`);
            return periodeExists;
        }

        // Tentukan tahun akademik dan semester saat ini
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // 1-12

        // Logika semester:
        // Ganjil: Agustus/September - Januari (bulan 8-1)
        // Genap: Februari - Juli (bulan 2-7)
        let semester, tahunAkademik, tanggalMulai, tanggalSelesai;

        if (currentMonth >= 8 || currentMonth <= 1) {
            // Semester Ganjil
            semester = 'ganjil';
            if (currentMonth >= 8) {
                tahunAkademik = `${currentYear}/${currentYear + 1}`;
                tanggalMulai = new Date(currentYear, 8, 1); // 1 September
                tanggalSelesai = new Date(currentYear + 1, 0, 31); // 31 Januari tahun depan
            } else {
                tahunAkademik = `${currentYear - 1}/${currentYear}`;
                tanggalMulai = new Date(currentYear - 1, 8, 1);
                tanggalSelesai = new Date(currentYear, 0, 31);
            }
        } else {
            // Semester Genap
            semester = 'genap';
            tahunAkademik = `${currentYear - 1}/${currentYear}`;
            tanggalMulai = new Date(currentYear, 1, 1); // 1 Februari
            tanggalSelesai = new Date(currentYear, 6, 31); // 31 Juli
        }

        // Buat periode baru dengan konfigurasi default
        const periode = await PeriodeSkripsi.create({
            tahun_akademik: tahunAkademik,
            semester: semester,
            isActive: true,
            kuotaPerDosen: 10,
            formatNomorKartu: 'KB-',
            tanggalMulaiBimbingan: tanggalMulai,
            tanggalSelesaiBimbingan: tanggalSelesai
        });

        console.log('✅ Default periode skripsi created successfully!');
        console.log(`📅 Tahun Akademik: ${tahunAkademik}`);
        console.log(`📚 Semester: ${semester}`);
        console.log(`👥 Kuota per Dosen: 10 mahasiswa`);
        console.log(`📝 Format Nomor Kartu: KB-{tahun}-{semester}-{nomor}`);
        console.log(`📆 Periode Bimbingan: ${tanggalMulai.toLocaleDateString('id-ID')} - ${tanggalSelesai.toLocaleDateString('id-ID')}`);

        return periode;
    } catch (error) {
        console.error('❌ Error creating default periode:', error);
        throw error;
    }
};

// Fungsi untuk membuat multiple periode (opsional, untuk testing)
export const createMultiplePeriode = async () => {
    try {
        console.log('🌱 Creating multiple periode skripsi for testing...');

        const periodes = [
            {
                tahun_akademik: '2023/2024',
                semester: 'ganjil',
                isActive: false,
                kuotaPerDosen: 10,
                formatNomorKartu: 'KB',
                tanggalMulaiBimbingan: new Date('2023-09-01'),
                tanggalSelesaiBimbingan: new Date('2024-01-31')
            },
            {
                tahun_akademik: '2023/2024',
                semester: 'genap',
                isActive: false,
                kuotaPerDosen: 10,
                formatNomorKartu: 'KB',
                tanggalMulaiBimbingan: new Date('2024-02-01'),
                tanggalSelesaiBimbingan: new Date('2024-07-31')
            },
            {
                tahun_akademik: '2024/2025',
                semester: 'ganjil',
                isActive: true,
                kuotaPerDosen: 12,
                formatNomorKartu: 'KB',
                tanggalMulaiBimbingan: new Date('2024-09-01'),
                tanggalSelesaiBimbingan: new Date('2025-01-31')
            }
        ];

        for (const periodeData of periodes) {
            // Cek apakah periode sudah ada
            const existing = await PeriodeSkripsi.findOne({
                where: {
                    tahun_akademik: periodeData.tahun_akademik,
                    semester: periodeData.semester
                }
            });

            if (!existing) {
                await PeriodeSkripsi.create(periodeData);
                console.log(`✅ Created periode: ${periodeData.tahun_akademik} - ${periodeData.semester}`);
            } else {
                console.log(`ℹ️  Periode ${periodeData.tahun_akademik} - ${periodeData.semester} already exists`);
            }
        }

        console.log('✅ All periode created successfully!');
    } catch (error) {
        console.error('❌ Error creating multiple periode:', error);
        throw error;
    }
};

// Fungsi utama untuk menjalankan semua seeder
export const runSeeder = async () => {
    try {
        console.log('\n🚀 Starting database seeder...\n');

        // 1. Buat admin default
        await createDefaultAdmin();

        // 2. Buat periode default
        await createDefaultPeriode();

        // 3. (Opsional) Buat multiple periode untuk testing
        // Uncomment jika ingin membuat beberapa periode sekaligus
        // await createMultiplePeriode();

        console.log('\n🎉 Seeder completed successfully!\n');
    } catch (error) {
        console.error('\n💥 Seeder failed:', error);
        throw error;
    }
};