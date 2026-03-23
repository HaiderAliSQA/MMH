import { Request, Response } from 'express';
import { Notification } from '../models/Notification.model';

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = (req as any).user;
        if (!user) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }

        const query: any = {
            $or: [
                { forRole: user.role },
                { forUser: user._id }
            ]
        };

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(20);

        const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

        res.status(200).json({
            success: true,
            data: notifications,
            unreadCount
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error fetching notifications' });
    }
};

export const markRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const notification = await Notification.findByIdAndUpdate(
            id,
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            res.status(404).json({ message: 'Notification not found' });
            return;
        }

        res.status(200).json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error('Error marking notification read:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const markAllRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = (req as any).user;
        if (!user) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }

        const query: any = {
            $or: [
                { forRole: user.role },
                { forUser: user._id }
            ],
            isRead: false
        };

        await Notification.updateMany(query, { isRead: true });

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Error marking all notifications read:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
