[
  {
    $project: {
      geom: 0,
      owner_full_name: 0,
      compare_cadastral_and_report_shape: 0,
      tin_total_gis_area_ha: 0,
      compare_cadastral_and_report_shape_diff: 0,
      compare_submission_diff: 0,
      geom_g_s: 0,
      geom_g_s_number: 0,
      removed_by_qx: 0,
      sp_unit_type: 0,
      tenancy_type_code: 0,
      survey_match: 0,
      submitted_five_shape: 0,
      five_shape_crop_area: 0,
      five_shape_planted_area: 0,
      five_shape_total_land_area: 0,
      area_source: 0,
      compare_submission: 0,
      ba_unit_type: 0,
      geom_g: 0,
      property_kind: 0,
      is_tin_14: 0
    }
  },
  {
    $group: {
      _id: {
        tuman_code: "$tuman_code",
        tin: "$tin"
      },
      total_gis_area_ha: {
        $sum: {
          $toDouble: "$gis_area_ha"
        }
      },
      count: {
        $sum: 1
      }
    }
  },
  {
    $addFields: {
      tuman_code: "$_id.tuman_code",
      tin: "$_id.tin"
    }
  },
  {
    $lookup: {
      from: "six_shapes",
      let: {
        tin: {
          $toString: "$tin"
        },
        soato: {
          $toString: "$tuman_code"
        }
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                {
                  $eq: [
                    {
                      $toString:
                        "$organization_inn"
                    },
                    "$$tin"
                  ]
                },
                {
                  $eq: [
                    {
                      $toString: "$soato"
                    },
                    "$$soato"
                  ]
                }
              ]
            }
          }
        },
        {
          $group: {
            _id: {
              organization_inn: {
                $toString: "$organization_inn"
              },
              okpo: {
                $toString: "$okpo"
              }
            },
            total_land_area: {
              $sum: {
                $toDouble: "$total_land_area"
              }
            },
            shapes: {
              $push: "$$ROOT"
            }
          }
        },
        {
          $project: {
            _id: 0,
            organization_inn:
              "$_id.organization_inn",
            okpo: "$_id.okpo",
            total_land_area: 1,
            shapes: 1
          }
        }
      ],
      as: "shapes_info"
    }
  },
  {
    $project:
      /**
       * newField: The new field name.
       * expression: The new field expression.
       */
      {
        "shapes_info.shapes": 0,
        "shapes_info.organization_inn": 0
      }
  }
]