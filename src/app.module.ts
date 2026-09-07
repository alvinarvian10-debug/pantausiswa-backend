import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SiswaModule } from './master-data/siswa/siswa.module';
import { GuruModule } from './master-data/guru/guru.module';
import { KelasModule } from './master-data/kelas/kelas.module';
import { MapelModule } from './master-data/mapel/mapel.module';
import { PresensiModule } from './presensi/presensi.module';
import { IzinModule } from './izin/izin.module';
import { TugasModule } from './tugas/tugas.module';
import { InventarisModule } from './inventaris/inventaris.module';
import { PeminjamanModule } from './peminjaman/peminjaman.module';
import { AduanModule } from './aduan/aduan.module';
import { AnalitikModule } from './analitik/analitik.module';
import { ImportModule } from './import/import.module';
import { PengaturanModule } from './pengaturan/pengaturan.module';
import { PasswordRequestModule } from './password-request/password-request.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Anti brute-force: default 100 req/menit per IP (in-memory;
    // multi-instance perlu storage Redis). Login diperketat di controller.
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    SiswaModule,
    GuruModule,
    KelasModule,
    MapelModule,
    PresensiModule,
    IzinModule,
    TugasModule,
    InventarisModule,
    PeminjamanModule,
    AduanModule,
    AnalitikModule,
    ImportModule,
    PengaturanModule,
    PasswordRequestModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
