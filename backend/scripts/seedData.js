import argon2 from 'argon2';
import User from '../models/User.js';
import Dosen from '../models/Dosen.js';
import Mahasiswa from '../models/Mahasiswa.js';
import ProgramStudi from '../models/ProgramStudi.js';
import PengajuanJudul from '../models/PengajuanJudul.js';
import { createDefaultAdmin, createDefaultPeriode, createMultiplePeriode } from './createDefaultAdmin.js';

// Seed Program Studi
export const seedProgramStudi = async () => {
    try {
        console.log('🌱 Seeding Program Studi...');

        const prodiData = [
            { kode_prodi: 'TI', program_studi: 'Teknik Informatika' },
            { kode_prodi: 'SI', program_studi: 'Sistem Informasi' },
            { kode_prodi: 'MI', program_studi: 'Manajemen Informatika' },
            { kode_prodi: 'TK', program_studi: 'Teknik Komputer' },
            { kode_prodi: 'RPL', program_studi: 'Rekayasa Perangkat Lunak' }
        ];

        for (const prodi of prodiData) {
            const exists = await ProgramStudi.findOne({ where: { kode_prodi: prodi.kode_prodi } });
            if (!exists) {
                await ProgramStudi.create(prodi);
                console.log(`✅ Created program studi: ${prodi.program_studi}`);
            }
        }

        console.log('✅ Program Studi seeding completed!');
    } catch (error) {
        console.error('❌ Error seeding Program Studi:', error);
        throw error;
    }
};

// Seed Dosen
export const seedDosen = async () => {
    try {
        console.log('🌱 Seeding Dosen...');

        const prodiTI = await ProgramStudi.findOne({ where: { kode_prodi: 'TI' } });
        const prodiSI = await ProgramStudi.findOne({ where: { kode_prodi: 'SI' } });

        const dosenData = [
            {
                user: {
                    email: 'dosen1@bimbingan.ac.id',
                    password: await argon2.hash('dosen123'),
                    role: 'dosen'
                },
                profile: {
                    nidn: '0123456789',
                    nama: 'Dr. Ahmad Subandi, M.Kom',
                    gelar: 'M.Kom',
                    prodi_id: prodiTI.prodi_id,
                    fakultas: 'Fakultas Teknik',
                    bidang_keahlian: 'Machine Learning',
                    jabatan_akademik: 'Lektor',
                    kontak: '081234567890',
                    email_institusi: 'ahmad.subandi@univ.ac.id'
                }
            },
            {
                user: {
                    email: 'dosen2@bimbingan.ac.id',
                    password: await argon2.hash('dosen123'),
                    role: 'dosen'
                },
                profile: {
                    nidn: '0123456790',
                    nama: 'Dr. Siti Nurhalimah, M.T',
                    gelar: 'M.T',
                    prodi_id: prodiTI.prodi_id,
                    fakultas: 'Fakultas Teknik',
                    bidang_keahlian: 'Web Development',
                    jabatan_akademik: 'Lektor Kepala',
                    kontak: '081234567891',
                    email_institusi: 'siti.nurhalimah@univ.ac.id'
                }
            },
            {
                user: {
                    email: 'dosen3@bimbingan.ac.id',
                    password: await argon2.hash('dosen123'),
                    role: 'dosen'
                },
                profile: {
                    nidn: '0123456791',
                    nama: 'Prof. Budi Santoso, Ph.D',
                    gelar: 'Ph.D',
                    prodi_id: prodiSI.prodi_id,
                    fakultas: 'Fakultas Teknik',
                    bidang_keahlian: 'Database Systems',
                    jabatan_akademik: 'Guru Besar',
                    kontak: '081234567892',
                    email_institusi: 'budi.santoso@univ.ac.id'
                }
            }
        ];

        for (const data of dosenData) {
            const userExists = await User.findOne({ where: { email: data.user.email } });
            if (!userExists) {
                const user = await User.create(data.user);
                await Dosen.create({
                    id_user: user.id_user,
                    ...data.profile
                });
                console.log(`✅ Created dosen: ${data.profile.nama}`);
            }
        }

        console.log('✅ Dosen seeding completed!');
    } catch (error) {
        console.error('❌ Error seeding Dosen:', error);
        throw error;
    }
};

// Seed Mahasiswa
export const seedMahasiswa = async () => {
    try {
        console.log('🌱 Seeding Mahasiswa...');

        const prodiTI = await ProgramStudi.findOne({ where: { kode_prodi: 'TI' } });
        const prodiSI = await ProgramStudi.findOne({ where: { kode_prodi: 'SI' } });

        const mahasiswaData = [
            {
                user: {
                    email: 'mahasiswa1@bimbingan.ac.id',
                    password: await argon2.hash('mahasiswa123'),
                    role: 'mahasiswa'
                },
                profile: {
                    nim: '210001',
                    nama_lengkap: 'John Doe',
                    prodi_id: prodiTI.prodi_id,
                    angkatan: 2021,
                    semester: 8,
                    kontak: '081234567893',
                    email_kampus: 'john.doe@student.univ.ac.id'
                }
            },
            {
                user: {
                    email: 'mahasiswa2@bimbingan.ac.id',
                    password: await argon2.hash('mahasiswa123'),
                    role: 'mahasiswa'
                },
                profile: {
                    nim: '210002',
                    nama_lengkap: 'Jane Smith',
                    prodi_id: prodiTI.prodi_id,
                    angkatan: 2021,
                    semester: 8,
                    kontak: '081234567894',
                    email_kampus: 'jane.smith@student.univ.ac.id'
                }
            },
            {
                user: {
                    email: 'mahasiswa3@bimbingan.ac.id',
                    password: await argon2.hash('mahasiswa123'),
                    role: 'mahasiswa'
                },
                profile: {
                    nim: '210003',
                    nama_lengkap: 'Robert Wilson',
                    prodi_id: prodiTI.prodi_id,
                    angkatan: 2021,
                    semester: 8,
                    kontak: '081234567895',
                    email_kampus: 'robert.wilson@student.univ.ac.id'
                }
            },
            {
                user: {
                    email: 'mahasiswa4@bimbingan.ac.id',
                    password: await argon2.hash('mahasiswa123'),
                    role: 'mahasiswa'
                },
                profile: {
                    nim: '210004',
                    nama_lengkap: 'Sarah Johnson',
                    prodi_id: prodiTI.prodi_id,
                    angkatan: 2021,
                    semester: 8,
                    kontak: '081234567896',
                    email_kampus: 'sarah.johnson@student.univ.ac.id'
                }
            },
            {
                user: {
                    email: 'mahasiswa5@bimbingan.ac.id',
                    password: await argon2.hash('mahasiswa123'),
                    role: 'mahasiswa'
                },
                profile: {
                    nim: '210005',
                    nama_lengkap: 'Michael Brown',
                    prodi_id: prodiTI.prodi_id,
                    angkatan: 2021,
                    semester: 8,
                    kontak: '081234567897',
                    email_kampus: 'michael.brown@student.univ.ac.id'
                }
            }
        ];

        for (const data of mahasiswaData) {
            const userExists = await User.findOne({ where: { email: data.user.email } });
            if (!userExists) {
                const user = await User.create(data.user);
                await Mahasiswa.create({
                    id_user: user.id_user,
                    ...data.profile
                });
                console.log(`✅ Created mahasiswa: ${data.profile.nama_lengkap}`);
            }
        }

        console.log('✅ Mahasiswa seeding completed!');
    } catch (error) {
        console.error('❌ Error seeding Mahasiswa:', error);
        throw error;
    }
};

// Seed Sample Pengajuan Judul
export const seedSamplePengajuan = async () => {
    try {
        console.log('🌱 Seeding Sample Pengajuan...');

        const mahasiswa1 = await Mahasiswa.findOne({ where: { nim: '210001' } });
        const mahasiswa2 = await Mahasiswa.findOne({ where: { nim: '210002' } });
        const dosen1 = await Dosen.findOne({ where: { nidn: '0123456789' } });
        const dosen2 = await Dosen.findOne({ where: { nidn: '0123456790' } });

        const pengajuanData = [
            {
                id_mahasiswa: mahasiswa1.id_mahasiswa,
                title: 'Sistem Rekomendasi Film Menggunakan Machine Learning dengan Algoritma Collaborative Filtering',
                description: 'Penelitian ini bertujuan untuk mengembangkan sistem rekomendasi film yang dapat memberikan rekomendasi film yang sesuai dengan preferensi pengguna menggunakan teknik machine learning. Sistem akan menggunakan algoritma collaborative filtering untuk menganalisis pola perilaku pengguna dan memberikan rekomendasi yang akurat.',
                bidang_topik: 'Machine Learning',
                keywords: 'machine learning, collaborative filtering, sistem rekomendasi, film',
                status: 'diterima',
                dosenId1: dosen1.id_dosen,
                dosenId2: dosen2.id_dosen,
                approvedAt: new Date()
            },
            {
                id_mahasiswa: mahasiswa2.id_mahasiswa,
                title: 'Aplikasi E-Commerce Berbasis Web dengan Fitur Augmented Reality untuk Virtual Try-On',
                description: 'Penelitian ini mengembangkan aplikasi e-commerce yang memungkinkan pelanggan untuk mencoba produk secara virtual menggunakan teknologi augmented reality. Aplikasi akan dibangun berbasis web dengan framework modern dan integrasi AR untuk meningkatkan pengalaman berbelanja online.',
                bidang_topik: 'Web Development',
                keywords: 'e-commerce, augmented reality, web application, virtual try-on',
                status: 'diajukan'
            }
        ];

        for (const data of pengajuanData) {
            const exists = await PengajuanJudul.findOne({
                where: {
                    id_mahasiswa: data.id_mahasiswa,
                    title: data.title
                }
            });
            if (!exists) {
                await PengajuanJudul.create(data);
                console.log(`✅ Created pengajuan: ${data.title.substring(0, 50)}...`);
            }
        }

        console.log('✅ Sample Pengajuan seeding completed!');
    } catch (error) {
        console.error('❌ Error seeding Sample Pengajuan:', error);
        throw error;
    }
};

// Main seeder function
export const runAllSeeders = async () => {
    try {
        console.log('🚀 Starting database seeding...\n');

        await createDefaultAdmin();
        await createDefaultPeriode();
        await createMultiplePeriode();
        await seedProgramStudi();
        await seedDosen();
        await seedMahasiswa();
        await seedSamplePengajuan();

        console.log('\n🎉 All seeders completed successfully!');
        console.log('\n📋 Summary:');
        console.log('👤 Admin: admin@bimbingan.ac.id / admin123');
        console.log('👨‍🏫 Dosen: dosen1@bimbingan.ac.id / dosen123');
        console.log('👨‍🎓 Mahasiswa: mahasiswa1@bimbingan.ac.id / mahasiswa123');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    }
};
