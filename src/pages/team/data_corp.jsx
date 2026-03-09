  const officeLocations = [
    { id: 1, name: 'Siège Social - Genève', address: '123 Rue Principale, Genève, Suisse' },
    { id: 2, name: 'Bureau de New York', address: '789 Broadway, New York, USA' },
    { id: 3, name: 'Bureau de Tokyo', address: '1011 Shibuya Street, Tokyo, Japon' },
    { id: 4, name: 'Bureau de Sydney', address: '1213 George Street, Sydney, Australie' },
    { id: 5, name: 'Bureau de Berlin', address: '1415 Alexanderplatz, Berlin, Allemagne' },
  ];

  const teamMembers = [
    { id: 1, name: 'Alice Dupont', role: 'Responsable RH', email: 'a.d@exemple.com', phone: '+41 22 123 45 67', departments: [1], office: 1 },
    { id: 2, name: 'Bob Martin', role: 'Chargé de recrutement', email: 'b.m@exemple.com', phone: '+41 22 234 56 78', departments: [1], office: 1 },
    { id: 3, name: 'Charlie Durand', role: 'Gestionnaire de paie', email: 'c.d@exemple.com', phone: '+41 22 345 67 89', departments: [3], office: 1 },
    { id: 4, name: 'David Moreau', role: 'Responsable formation', email: 'd.m@exemple.com', phone: '+41 22 456 78 90', departments: [3], office: 1 },
    { id: 5, name: 'Eve Lefebvre', role: 'Chargé de communication interne', email: 'e.l@exemple.com', phone: '+41 22 567 89 01', departments: [3], office: 1 },
    { id: 6, name: 'Frank Girard', role: 'Responsable des relations sociales', email: 'f.g@exemple.com', phone: '+41 22 678 90 12', departments: [3], office: 1 },
    { id: 7, name: 'Grace Lambert', role: 'Chargé de la gestion des talents', email: 'g.l@exemple.com', phone: '+41 22 789 01 23', departments: [3], office: 1 }
  ];

export { officeLocations, teamMembers };