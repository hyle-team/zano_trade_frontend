import React from 'react';
import Button from '@/components/UI/Button/Button';
import { PlusIcon, TrashIcon, UserIcon } from '@/components/UI/Icons';
import { classes } from '@/utils/utils';
import styles from './styles.module.scss';

interface Admin {
	alias: string;
	isOwner: boolean;
	key: number;
}

interface AdminsProps {
	admins: Admin[];
	loading: boolean;
	currentAlias?: string;
	alias: string;
	setAlias: (_value: string) => void;
	adding: boolean;
	addAdmin: () => void;
	removeAdmin: (_admin: Admin) => void;
}

const Admins: React.FC<AdminsProps> = ({
	admins,
	loading,
	currentAlias,
	alias,
	setAlias,
	adding,
	addAdmin,
	removeAdmin,
}) => {
	const sortedAdmins = [...admins].sort((a, b) => Number(b.isOwner) - Number(a.isOwner));

	const renderList = () => {
		if (loading) return <div className={styles.loader} />;

		if (!admins.length) {
			return (
				<div className={styles.placeholder}>
					<p>No admins found</p>
				</div>
			);
		}

		return (
			<div className={styles.list}>
				{sortedAdmins.map((admin) => (
					<div key={admin.key} className={styles.row}>
						<div className={styles.row__main}>
							<span className={styles.avatar}>
								{admin.alias.charAt(0).toUpperCase()}
							</span>
							<div className={styles.row__info}>
								<p className={styles.row__title}>
									@{admin.alias}
									{admin.alias === currentAlias && (
										<span className={styles.row__you}>You</span>
									)}
								</p>
								<span
									className={classes(
										styles.badge,
										admin.isOwner ? styles.badge__info : styles.badge__muted,
									)}
								>
									{admin.isOwner ? 'Owner' : 'Admin'}
								</span>
							</div>
						</div>

						{!admin.isOwner && (
							<Button
								size="sm"
								variant="danger"
								className={styles.row__action}
								aria-label={`Remove @${admin.alias} from admins`}
								title="Remove admin"
								onClick={() => removeAdmin(admin)}
							>
								<TrashIcon />
							</Button>
						)}
					</div>
				))}
			</div>
		);
	};

	return (
		<section className={styles.section}>
			<div className={styles.section__head}>
				<div>
					<h2>
						Admins
						{!loading && <span className={styles.count}>{admins.length}</span>}
					</h2>
					<p>Users with access to this panel</p>
				</div>
			</div>

			<form
				className={styles.addForm}
				onSubmit={(e) => {
					e.preventDefault();
					addAdmin();
				}}
			>
				<label className={styles.input}>
					<UserIcon width={16} height={16} />
					<input
						placeholder="Enter alias"
						value={alias}
						onChange={(e) => setAlias(e.target.value)}
					/>
				</label>
				<Button
					type="submit"
					variant="primary"
					className={styles.addForm__btn}
					loading={adding}
					disabled={!alias.trim()}
				>
					{!adding && <PlusIcon />}
					Add
				</Button>
			</form>

			{renderList()}
		</section>
	);
};

export default Admins;
