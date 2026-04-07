import React from 'react';
import { Outlet } from 'react-router-dom';
import MainLayout from '../MainLayout';
import { useAuth } from '../../hooks/useAuth';

export const AdminLayout: React.FC = () => {
  const { user } = useAuth();
  return (
    <MainLayout user={user} title="Admin Portal" subtitle="Management & Oversight">
      <Outlet />
    </MainLayout>
  );
};

export const DoctorLayout: React.FC = () => {
  const { user } = useAuth();
  return (
    <MainLayout user={user} title="Doctor Portal" subtitle="Clinical Services">
      <Outlet />
    </MainLayout>
  );
};

export const ReceptionistLayout: React.FC = () => {
  const { user } = useAuth();
  return (
    <MainLayout user={user} title="Receptionist Portal" subtitle="OPD & Registration">
      <Outlet />
    </MainLayout>
  );
};

export const LabLayout: React.FC = () => {
  const { user } = useAuth();
  return (
    <MainLayout user={user} title="Laboratory Portal" subtitle="Diagnostics & Results">
      <Outlet />
    </MainLayout>
  );
};

export const PharmacyLayout: React.FC = () => {
  const { user } = useAuth();
  return (
    <MainLayout user={user} title="Pharmacy Portal" subtitle="Medicine Dispensing">
      <Outlet />
    </MainLayout>
  );
};

export const DispensaryLayout: React.FC = () => {
  const { user } = useAuth();
  return (
    <MainLayout user={user} title="Trust Dispensary" subtitle="Free Medicating Services">
      <Outlet />
    </MainLayout>
  );
};

export const ManagerLayout: React.FC = () => {
  const { user } = useAuth();
  return (
    <MainLayout user={user} title="Manager Portal" subtitle="Analytics & Reporting">
      <Outlet />
    </MainLayout>
  );
};

export const PatientLayout: React.FC = () => {
  const { user } = useAuth();
  return (
    <MainLayout user={user} title="Patient Portal" subtitle="My Medical Records">
      <Outlet />
    </MainLayout>
  );
};
