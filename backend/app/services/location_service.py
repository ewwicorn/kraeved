from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.location import Location, Tag
from app.schemas.location import LocationCreate, LocationUpdate


class LocationService:

    # ── Locations ─────────────────────────────────────────────────────────────

    async def get_list(
        self,
        db: AsyncSession,
        *,
        page: int = 1,
        page_size: int = 20,
        tag_slugs: list[str] | None = None,
        region: str | None = None,
        price_max: int | None = None,
        only_active: bool = True,
    ):
        q = select(Location)

        if only_active:
            q = q.where(Location.is_active == True)
        if region:
            q = q.where(Location.region == region)
        if price_max is not None:
            q = q.where(Location.price_from <= price_max)
        if tag_slugs:
            # локация должна иметь ВСЕ запрошенные теги
            for slug in tag_slugs:
                q = q.where(
                    Location.tags.any(Tag.slug == slug)
                )

        # total
        count_q = select(func.count()).select_from(q.subquery())
        total = (await db.execute(count_q)).scalar_one()

        # pagination
        q = q.offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(q)
        items = result.scalars().all()

        return items, total

    async def get_by_slug(self, db: AsyncSession, slug: str) -> Location:
        result = await db.execute(select(Location).where(Location.slug == slug))
        location = result.scalar_one_or_none()
        if not location:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
        return location

    async def get_by_id(self, db: AsyncSession, location_id: UUID) -> Location:
        result = await db.execute(select(Location).where(Location.id == location_id))
        location = result.scalar_one_or_none()
        if not location:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
        return location

    async def create(
        self,
        db: AsyncSession,
        data: LocationCreate,
        seller_id: UUID | None = None,
    ) -> Location:
        # проверка уникальности slug
        existing = await db.execute(select(Location).where(Location.slug == data.slug))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slug already exists")

        tags = await self._resolve_tags(db, data.tag_ids)

        location = Location(
            slug=data.slug,
            name=data.name,
            description=data.description,
            short_description=data.short_description,
            lat=data.lat,
            lng=data.lng,
            address=data.address,
            region=data.region,
            photos=data.photos,
            price_from=data.price_from,
            price_to=data.price_to,
            seller_id=seller_id,
            avg_temp_summer=data.avg_temp_summer,
            avg_temp_winter=data.avg_temp_winter,
            duration_hours_min=data.duration_hours_min,
            duration_hours_max=data.duration_hours_max,
            group_size_min=data.group_size_min,
            group_size_max=data.group_size_max,
            is_active=False,  # всегда draft при создании
            tags=tags,
        )
        db.add(location)
        await db.commit()
        await db.refresh(location)
        return location

    async def update(
        self,
        db: AsyncSession,
        location: Location,
        data: LocationUpdate,
    ) -> Location:
        update_data = data.model_dump(exclude_unset=True, exclude={"tag_ids"})
        for field, value in update_data.items():
            setattr(location, field, value)

        if data.tag_ids is not None:
            location.tags = await self._resolve_tags(db, data.tag_ids)

        await db.commit()
        await db.refresh(location)
        return location

    async def set_active(self, db: AsyncSession, location: Location, is_active: bool) -> Location:
        location.is_active = is_active
        await db.commit()
        await db.refresh(location)
        return location

    async def delete(self, db: AsyncSession, location: Location) -> None:
        await db.delete(location)
        await db.commit()

    # ── Tags ──────────────────────────────────────────────────────────────────

    async def get_all_tags(self, db: AsyncSession) -> list[Tag]:
        result = await db.execute(select(Tag).order_by(Tag.group, Tag.label_ru))
        return result.scalars().all()

    async def _resolve_tags(self, db: AsyncSession, tag_ids: list[UUID]) -> list[Tag]:
        if not tag_ids:
            return []
        result = await db.execute(select(Tag).where(Tag.id.in_(tag_ids)))
        tags = result.scalars().all()
        if len(tags) != len(tag_ids):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Some tag_ids not found")
        return list(tags)


location_service = LocationService()
