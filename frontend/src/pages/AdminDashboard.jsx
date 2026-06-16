import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Badge,
  Button,
  Container,
  Flex,
  Heading,
  
  Stack,
  Table,
  Tbody,
  Th,
  Thead,
  Tr,
  Td,
  TableContainer,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  useToast,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
// removed dependency on @chakra-ui/icons to avoid runtime install issues
import api, { setAuthToken } from '../api/axiosConfig';

function AdminDashboard() {
  const [leaders, setLeaders] = useState([]);
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeEntity, setActiveEntity] = useState('leader');
  const [selectedItem, setSelectedItem] = useState(null);
  const [bucket, setBucket] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isChangeOpen, onOpen: onChangeOpen, onClose: onChangeClose } = useDisclosure();
  const toast = useToast();
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  setAuthToken(token);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leadersResponse, eventsResponse, registrationsResponse] = await Promise.all([
        api.get('/leaders'),
        api.get('/events'),
        api.get('/admin/submissions'),
      ]);
      setLeaders(leadersResponse.data.data || []);
      setEvents(eventsResponse.data.data || []);
      setRegistrations(registrationsResponse.data.data || []);
    } catch (error) {
      console.error(error);
      toast({ title: 'Unable to load data', status: 'error', duration: 4000, isClosable: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/admin-login');
      return;
    }
    fetchData();
  }, []);

  const handleCreate = (type) => {
    setActiveEntity(type);
    setSelectedItem(null);
    setBucket({
      name: '',
      year: '',
      achievement: '',
      photoUrl: '',
      title: '',
      description: '',
      denary: '',
      parish: '',
      date: '',
      venue: '',
      imageUrlEvent: '',
      photoFile: null,
      mediaFiles: null,
    });
    onOpen();
  };

  const handleEdit = (type, item) => {
    setActiveEntity(type);
    setSelectedItem(item);
    setBucket({
      name: item.name || '',
      year: item.year || '',
      achievement: item.achievement || '',
      photoUrl: item.photo_url || '',
      title: item.title || '',
      description: item.description || '',
      denary: item.denary || '',
      parish: item.parish || '',
      date: item.event_date ? new Date(item.event_date).toISOString().slice(0, 16) : '',
      venue: item.venue || '',
      imageUrlEvent: item.imageUrlEvent || '',
      photoFile: null,
      mediaFiles: null,
    });
    onOpen();
  };

  const handleDelete = async (type, id) => {
    try {
      await api.delete(`/${type === 'leader' ? 'leaders' : 'events'}/${id}`);
      toast({ title: 'Deleted successfully', status: 'success', duration: 3000, isClosable: true });
      fetchData();
    } catch (error) {
      toast({ title: 'Delete failed', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const handleDeleteRegistration = async (id) => {
    try {
      await api.delete(`/admin/submissions/${id}`);
      toast({ title: 'Member record deleted', status: 'success', duration: 3000, isClosable: true });
      fetchData();
    } catch (error) {
      toast({ title: 'Delete failed', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/admin/submissions/${id}`, { status });
      toast({ title: `Registration ${status}`, status: 'success', duration: 3000, isClosable: true });
      fetchData();
    } catch (error) {
      toast({ title: 'Status update failed', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const handleSave = async () => {
    const route = activeEntity === 'leader' ? 'leaders' : 'events';
    
    const formData = new FormData();
    if (activeEntity === 'leader') {
      formData.append('name', bucket.name);
      formData.append('year', bucket.year);
      formData.append('achievement', bucket.achievement);
      if (bucket.photoFile) {
        formData.append('photo', bucket.photoFile);
      } else if (bucket.photoUrl) {
        formData.append('photo_url', bucket.photoUrl);
      }
    } else {
      formData.append('title', bucket.title);
      formData.append('description', bucket.description);
      formData.append('denary', bucket.denary);
      formData.append('parish', bucket.parish);
      formData.append('eventDate', bucket.date);
      formData.append('venue', bucket.venue);
      if (bucket.mediaFiles) {
        for (let i = 0; i < bucket.mediaFiles.length; i++) {
          formData.append('media', bucket.mediaFiles[i]);
        }
      }
    }

    try {
      if (selectedItem) {
        await api.put(`/${route}/${selectedItem.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast({ title: 'Updated successfully', status: 'success', duration: 3000, isClosable: true });
      } else {
        await api.post(`/${route}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast({ title: 'Created successfully', status: 'success', duration: 3000, isClosable: true });
      }
      onClose();
      fetchData();
    } catch (error) {
      toast({ title: 'Save failed', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/admin-login');
  };

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast({ title: 'Please fill all fields', status: 'warning', duration: 3000, isClosable: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'New passwords do not match', status: 'error', duration: 3000, isClosable: true });
      return;
    }

    try {
      await api.put('/admin/change-password', { currentPassword, newPassword });
      toast({ title: 'Password changed', status: 'success', duration: 3000, isClosable: true });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onChangeClose();
    } catch (error) {
      console.error(error);
      toast({ title: error.response?.data?.message || 'Change failed', status: 'error', duration: 4000, isClosable: true });
    }
  };

  return (
    <Container
      maxW="8xl"
      py={10}
      bg="whiteAlpha.90"
      borderRadius="3xl"
      p={{ base: 6, md: 8 }}
      boxShadow="2xl"
      border="1px solid"
      borderColor="whiteAlpha.200"
      backdropFilter="saturate(180%) blur(20px)"
    >
      <Flex justify="space-between" align="center" mb={6}>
        <Heading>Admin Dashboard</Heading>
        <Stack direction="row" spacing={2}>
          <Button colorScheme="teal" variant="outline" onClick={onChangeOpen}>Change Password</Button>
          <Button colorScheme="red" variant="outline" onClick={handleLogout}>Logout</Button>
        </Stack>
      </Flex>

      {loading ? (
        <Spinner />
      ) : (
        <Stack spacing={8}>
          <Tabs colorScheme="blue" variant="soft-rounded">
            <TabList>
              <Tab onClick={() => setActiveEntity('leader')}>Leaders</Tab>
              <Tab onClick={() => setActiveEntity('event')}>Events</Tab>
              <Tab onClick={() => setActiveEntity('members')}>Memberships</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <Flex justify="space-between" mb={4}>
                  <Heading size="md">Leader Management</Heading>
                  <Button colorScheme="blue" onClick={() => handleCreate('leader')}>Post New Leader</Button>
                </Flex>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Name</Th>
                        <Th>Year</Th>
                        <Th>Achievement</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {leaders.map((leader) => (
                        <Tr key={leader.id}>
                          <Td>{leader.name}</Td>
                          <Td>{leader.year}</Td>
                          <Td>{leader.achievement}</Td>
                          <Td>
                            <Stack direction="row" spacing={2}>
                              <Button aria-label="Update" size="sm" colorScheme="yellow" onClick={() => handleEdit('leader', leader)}>Update</Button>
                              <Button aria-label="Delete" size="sm" colorScheme="red" onClick={() => handleDelete('leader', leader.id)}>Delete</Button>
                            </Stack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </TabPanel>

              <TabPanel>
                <Flex justify="space-between" mb={4}>
                  <Heading size="md">Event Management</Heading>
                  <Button colorScheme="blue" onClick={() => handleCreate('event')}>Post New Event</Button>
                </Flex>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Title</Th>
                        <Th>Date</Th>
                        <Th>Venue</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {events.map((event) => (
                        <Tr key={event.id}>
                          <Td>{event.title}</Td>
                          <Td>{new Date(event.event_date || event.date).toLocaleDateString()}</Td>
                          <Td>{event.venue}</Td>
                          <Td>
                            <Stack direction="row" spacing={2}>
                              <Button aria-label="Update" size="sm" colorScheme="yellow" onClick={() => handleEdit('event', event)}>Update</Button>
                              <Button aria-label="Delete" size="sm" colorScheme="red" onClick={() => handleDelete('event', event.id)}>Delete</Button>
                            </Stack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </TabPanel>
              <TabPanel>
                <Flex justify="space-between" mb={4} alignItems="center">
                  <Heading size="md">Membership Approvals</Heading>
                  <Button colorScheme="purple" onClick={fetchData}>Refresh</Button>
                </Flex>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Name</Th>
                        <Th>Email</Th>
                        <Th>Denary</Th>
                        <Th>Parish</Th>
                        <Th>Status</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {registrations.map((registration) => (
                        <Tr key={registration.id}>
                          <Td>{registration.name}</Td>
                          <Td>{registration.email}</Td>
                          <Td>{registration.denary}</Td>
                          <Td>{registration.parish}</Td>
                          <Td>
                            <Badge
                              colorScheme={
                                registration.status === 'approved'
                                  ? 'green'
                                  : registration.status === 'rejected'
                                  ? 'red'
                                  : 'yellow'
                              }
                            >
                              {registration.status}
                            </Badge>
                          </Td>
                          <Td>
                            <Stack direction="row" spacing={2}>
                              <Button size="sm" colorScheme="green" onClick={() => handleUpdateStatus(registration.id, 'approved')}>Approve</Button>
                              <Button size="sm" colorScheme="orange" onClick={() => handleUpdateStatus(registration.id, 'rejected')}>Reject</Button>
                              <Button size="sm" colorScheme="red" onClick={() => handleDeleteRegistration(registration.id)}>Delete</Button>
                            </Stack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Stack>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedItem ? 'Edit' : 'Create'} {activeEntity === 'leader' ? 'Leader' : 'Event'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              {activeEntity === 'leader' ? (
                <>
                  <FormControl>
                    <FormLabel>Name</FormLabel>
                    <Input value={bucket.name} onChange={(e) => setBucket({ ...bucket, name: e.target.value })} />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Year</FormLabel>
                    <Input value={bucket.year} onChange={(e) => setBucket({ ...bucket, year: e.target.value })} />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Achievement</FormLabel>
                    <Textarea value={bucket.achievement} onChange={(e) => setBucket({ ...bucket, achievement: e.target.value })} placeholder="Enter achievement details" />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Photo Upload</FormLabel>
                    <Input type="file" accept="image/*" onChange={(e) => setBucket({ ...bucket, photoFile: e.target.files[0] })} />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Or Photo URL</FormLabel>
                    <Input value={bucket.photoUrl} onChange={(e) => setBucket({ ...bucket, photoUrl: e.target.value })} placeholder="If not uploading a file" />
                  </FormControl>
                </>
              ) : (
                <>
                  <FormControl>
                    <FormLabel>Title</FormLabel>
                    <Input value={bucket.title} onChange={(e) => setBucket({ ...bucket, title: e.target.value })} />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Description</FormLabel>
                    <Textarea value={bucket.description} onChange={(e) => setBucket({ ...bucket, description: e.target.value })} />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Denary</FormLabel>
                    <Input value={bucket.denary} onChange={(e) => setBucket({ ...bucket, denary: e.target.value })} />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Parish</FormLabel>
                    <Input value={bucket.parish} onChange={(e) => setBucket({ ...bucket, parish: e.target.value })} />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Date</FormLabel>
                    <Input type="datetime-local" value={bucket.date} onChange={(e) => setBucket({ ...bucket, date: e.target.value })} />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Venue</FormLabel>
                    <Input value={bucket.venue} onChange={(e) => setBucket({ ...bucket, venue: e.target.value })} />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Event Media (Upload)</FormLabel>
                    <Input type="file" accept="image/*,video/*" multiple onChange={(e) => setBucket({ ...bucket, mediaFiles: e.target.files })} />
                  </FormControl>
                </>
              )}
            </Stack>
          </ModalBody>

          <ModalFooter>
            <Button mr={3} onClick={onClose}>Cancel</Button>
            <Button colorScheme="blue" onClick={handleSave}>{selectedItem ? 'Update' : 'Create'}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

        <Modal isOpen={isChangeOpen} onClose={onChangeClose} isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Change Password</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Stack spacing={3}>
                <FormControl>
                  <FormLabel>Current Password</FormLabel>
                  <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>New Password</FormLabel>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>Confirm New Password</FormLabel>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </FormControl>
              </Stack>
            </ModalBody>
            <ModalFooter>
              <Button mr={3} onClick={onChangeClose}>Cancel</Button>
              <Button colorScheme="blue" onClick={handleChangePassword}>Change Password</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
    </Container>
  );
}

export default AdminDashboard;
