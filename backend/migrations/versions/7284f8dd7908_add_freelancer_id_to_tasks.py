from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '7284f8dd7908'
down_revision: Union[str, None] = 'f75b31c21ddc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table('applications',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('task_id', sa.Integer(), nullable=False),
    sa.Column('freelancer_id', sa.Integer(), nullable=False),
    sa.Column('comment', sa.Text(), nullable=True),
    sa.Column('proposed_price', sa.Float(), nullable=True),
    sa.Column('proposed_deadline', sa.DateTime(), nullable=True),
    sa.Column('status', sa.Enum('На рассмотрении', 'Принята', 'Отклонена', name='applicationstatus'), nullable=False),
    sa.ForeignKeyConstraint(['freelancer_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_applications_id'), 'applications', ['id'], unique=False)
    op.alter_column('profiles', 'rating',
               existing_type=sa.DOUBLE_PRECISION(precision=53),
               nullable=False)
    op.add_column('tasks', sa.Column('freelancer_id', sa.Integer(), nullable=True))
    op.create_foreign_key(None, 'tasks', 'users', ['freelancer_id'], ['id'])
    op.drop_constraint('applications_task_id_fkey', 'applications', type_='foreignkey')
    op.create_foreign_key(
        'applications_task_id_fkey',
        'applications', 'tasks',
        ['task_id'], ['id'],
        ondelete='CASCADE'
    )

def downgrade() -> None:
    op.drop_constraint('applications_task_id_fkey', 'applications', type_='foreignkey')
    op.create_foreign_key(
        'applications_task_id_fkey',
        'applications', 'tasks',
        ['task_id'], ['id']
    )
    op.drop_constraint(None, 'tasks', type_='foreignkey')
    op.drop_column('tasks', 'freelancer_id')
    op.alter_column('profiles', 'rating',
               existing_type=sa.DOUBLE_PRECISION(precision=53),
               nullable=True)
    op.drop_index(op.f('ix_applications_id'), table_name='applications')
    op.drop_table('applications')
